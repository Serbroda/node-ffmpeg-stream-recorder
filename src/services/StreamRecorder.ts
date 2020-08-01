import { getLogger } from '@log4js-node/log4js-api';
import * as fs from 'fs';
import * as path from 'path';
import { deleteFolderRecursive, findFiles, filenameMatchesPattern, mkdir } from '../helpers/FileHelper';
import { createUnique, createIsoDateTime } from '../helpers/UniqueHelper';
import { RecorderState } from '../models/RecorderState';
import { FFmpegProcess, FFmpegProcessResult } from './FFmpegProcess';
import { GenericEvent, IGenericEvent } from '../helpers/GenericEvent';
import { MediaFileCreator } from './MediaFileCreator';
import { IStreamRecorder, SessionInfo, StateChange, StreamRecorderOptions } from '../models/IStreamRecorder';
import { ToJson } from '../helpers/TypeHelper';

const logger = getLogger('ffmpeg-stream-recorder');

export class StreamRecorder implements IStreamRecorder, ToJson<IStreamRecorder> {
    private readonly _id: string;

    private readonly _onStartEvent = new GenericEvent<SessionInfo>();
    private readonly _onStopEvent = new GenericEvent<void>();
    private readonly _onCompleteEvent = new GenericEvent<void>();
    private readonly _onStateChangeEvent = new GenericEvent<StateChange>();
    private readonly _onSegmentFileAddEvent = new GenericEvent<string>();

    private _name: string;
    private _url: string;
    private _options: StreamRecorderOptions;
    private _recorderProcess: FFmpegProcess = new FFmpegProcess();
    private _sessionInfo: SessionInfo;
    private _fileWatcher: fs.FSWatcher | null = null;

    constructor(recorder: IStreamRecorder);
    constructor(url: string, options?: Partial<StreamRecorderOptions>);
    constructor(param1: string | IStreamRecorder, options?: Partial<StreamRecorderOptions>) {
        if (typeof param1 !== 'string') {
            this._id = param1.id;
            this._name = param1.name;
            this._url = param1.url;
            this._options = param1.options;
            this._sessionInfo = param1.sessionInfo;
        } else {
            this._id = createUnique();
            this._name = this._id;
            this._url = param1;
            this._options = {
                ...{
                    workDir: __dirname,
                    clean: true,
                    retry: 0,
                    createOnExit: true,
                },
                ...options,
            };
            this._sessionInfo = {
                state:
                    this._options.cwd && fs.existsSync(this._options.cwd)
                        ? RecorderState.STOPPED
                        : RecorderState.INITIAL,
                sessionUnique: createUnique(),
                retries: 0,
            };
        }
        if (options?.onStateChange) {
            this.onStateChange.on(options.onStateChange);
        }
    }

    public get onStart(): IGenericEvent<SessionInfo> {
        return this._onStartEvent.expose();
    }

    public get onStop(): IGenericEvent<void> {
        return this._onStopEvent.expose();
    }

    public get onComplete(): IGenericEvent<void> {
        return this._onCompleteEvent.expose();
    }

    public get onStateChange(): IGenericEvent<StateChange> {
        return this._onStateChangeEvent.expose();
    }

    public get onSegmentFileAdd(): IGenericEvent<string> {
        return this._onSegmentFileAddEvent.expose();
    }

    /**
     * Unique recorder id e.g 19112814560452.
     */
    public get id(): string {
        return this._id;
    }

    public get name(): string {
        return this._name;
    }

    public set name(val: string) {
        this._name = val;
    }

    /**
     * The options for the recorder.
     */
    public get options(): StreamRecorderOptions {
        return this._options;
    }

    /**
     * Informations about the current session.
     */
    public get sessionInfo(): SessionInfo {
        return this._sessionInfo;
    }

    /**
     * Gets the current recorder state.
     */
    public get state(): RecorderState {
        return this._sessionInfo.state;
    }

    /**
     * Sets the URL to record.
     * @param url Stream URL
     */
    public set url(url: string) {
        this._url = url;
    }

    /**
     * The URL to be recorded.
     */
    public get url(): string {
        return this._url;
    }

    /**
     * Sets the output file.
     * @param outFile Outfile
     */
    public set outFile(outFile: string | undefined) {
        this._options.outfile = outFile;
    }

    /**
     * Gets the defined output file.
     */
    public get outFile(): string | undefined {
        return this._options.outfile;
    }

    private setState(state: RecorderState) {
        logger.debug(`State changed: ${this._sessionInfo.state} -> ${state}`);
        if (state === RecorderState.RECORDING) {
            this._onStartEvent.trigger(this.sessionInfo);
        }
        if (state === RecorderState.SUCCESS) {
            this._onCompleteEvent.trigger();
        }
        if (state === RecorderState.EXITED_ABNORMALLY) {
            this._onStopEvent.trigger();
        }
        this._onStateChangeEvent.trigger({
            newState: state,
            oldState: this._sessionInfo.state,
            sessionInfo: this.sessionInfo,
        });
        this.sessionInfo.state = state;
    }

    /**
     * Gets true if recorder is currently busy or false if not.
     * @returns Busy true/false
     */
    public isBusy(): boolean {
        return (
            this._recorderProcess.isRunning() ||
            [RecorderState.RECORDING, RecorderState.FINISHING].includes(this._sessionInfo.state)
        );
    }

    /**
     * Starts the recording.
     */
    public start() {
        if (this._recorderProcess.isRunning()) {
            logger.warn('Process cannot be started because one is already running');
            return;
        }
        logger.debug('Starting recording');
        if (!this._options.cwd) {
            this._options.cwd = path.join(this._options.workDir, this._id);
        }
        mkdir(this._options.workDir, this._options.cwd);
        this._sessionInfo.sessionUnique = createUnique();
        this._sessionInfo.retries = 0;

        this.setState(RecorderState.RECORDING);
        this._fileWatcher = fs.watch(this._options.cwd!, (eventType, filename) => {
            if (
                eventType === 'rename' &&
                filenameMatchesPattern(filename, new RegExp(`seg_${this._id}_\\d*_\\d*\\.ts`))
            ) {
                this._onSegmentFileAddEvent.trigger(filename);
            }
        });
        this._recorderProcess.start(
            [
                '-y',
                '-i',
                this._url,
                '-c:v',
                'copy',
                '-c:a',
                'copy',
                '-f',
                'segment',
                '-segment_list',
                `seglist_${this._id}_${this._sessionInfo.sessionUnique}.txt`,
                '-segment_list_entry_prefix',
                'file ',
                `seg_${this._id}_${this._sessionInfo.sessionUnique}_%05d.ts`,
            ],
            {
                cwd: this._options.cwd,
                onExit: (result: FFmpegProcessResult) => {
                    if (this._fileWatcher) {
                        this._fileWatcher.close();
                    }
                    if (result.plannedKill) {
                        if (this._sessionInfo.state !== RecorderState.FINISHING) {
                            this.setState(RecorderState.STOPPED);
                        }
                    } else {
                        if (this._options.retry > 0 && this._sessionInfo.retries < this._options.retry) {
                            this._sessionInfo.retries++;
                            logger.debug(
                                `Process exited abnormally. Retry recording: ${this._sessionInfo.retries}/${this._options.retry}`
                            );
                            setTimeout(() => {
                                this.start();
                            }, 5000);
                        } else if (this._options.createOnExit) {
                            logger.debug(`Automatically creating output file because process exited abnormally`);
                            setTimeout(() => {
                                this.finish();
                            }, 1000);
                        } else {
                            this.setState(RecorderState.EXITED_ABNORMALLY);
                        }
                    }
                },
            }
        );
    }

    public pause() {
        this.stop(false);
    }

    /**
     * Stops the recording and creats the output file.
     */
    public stop(finish: boolean = true) {
        if (this._sessionInfo.state === RecorderState.SUCCESS) {
            return;
        }
        if (finish) {
            this._recorderProcess.killAsync(5000).then(() => {
                this.finish();
            });
        } else {
            this._recorderProcess.kill();
        }
    }

    /**
     * Discards the currently recordered files
     */
    public discard() {
        this._recorderProcess.killAsync(5000).then(() => {
            this.cleanWorkingDirectory();
        });
    }

    /**
     * Creates the target output file from currently recorded segments
     * @param outfile Target media file
     */
    public finish(outfile?: string) {
        if (this._sessionInfo.state === RecorderState.SUCCESS) {
            return;
        }
        this.setState(RecorderState.FINISHING);

        this.outFile = outfile
            ? outfile
            : this._options.outfile
            ? this._options.outfile
            : path.join(this.options.workDir!, `out_${this._id}-${createIsoDateTime()}.mp4`);

        if (!this.outFile) {
            logger.error('Cannot finish recording because no output file is specified');
            this.setState(RecorderState.ERROR);
            return;
        }
        logger.debug('Finishing recording');
        mkdir(path.dirname(this.outFile));
        this.createOutputFile(this.outFile).then(() => {
            this.cleanWorkingDirectory();
            this.setState(RecorderState.SUCCESS);
        });
    }

    private async createOutputFile(outfile: string): Promise<string | undefined> {
        return new Promise<string | undefined>(async (resolve, reject) => {
            try {
                logger.debug('Creating output file...');
                const file = await new MediaFileCreator(this._options.cwd!).create(outfile);
                setTimeout(() => resolve(file), 1000);
            } catch (err) {
                reject(err);
            }
        });
    }

    private cleanWorkingDirectory() {
        if (!this._options.clean || !this._options.cwd || !fs.existsSync(this._options.cwd)) {
            return;
        }
        logger.debug('Cleaning working directory ' + this._options.cwd);
        setTimeout(() => {
            deleteFolderRecursive(this._options.cwd!, false);
        }, 1000);
    }

    public toJson(): IStreamRecorder {
        return {
            id: this._id,
            url: this._url,
            name: this._name,
            options: this._options,
            sessionInfo: this._sessionInfo,
        };
    }
}
