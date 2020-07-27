import { getLogger } from '@log4js-node/log4js-api';
import * as fs from 'fs';
import * as path from 'path';
import { deleteFolderRecursive, findFiles, filenameMatchesPattern } from '../helpers/FileHelper';
import { createUnique } from '../helpers/UniqueHelper';
import { RecorderState } from '../models/RecorderState';
import { FFmpegProcess, FFmpegProcessResult } from './FFmpegProcess';
import { GenericEvent, IGenericEvent } from '../helpers/GenericEvent';
import { MediaFileCreator } from './MediaFileCreator';
import { IStreamRecorder, SessionInfo, StateChange, StreamRecorderOptions } from '../models/IStreamRecorder';

const logger = getLogger('ffmpeg-stream-recorder');

export class StreamRecorder implements IStreamRecorder {
    private readonly _id: string;

    private readonly _onStartEvent = new GenericEvent<SessionInfo>();
    private readonly _onStopEvent = new GenericEvent<void>();
    private readonly _onCompleteEvent = new GenericEvent<void>();
    private readonly _onStateChangeEvent = new GenericEvent<StateChange>();
    private readonly _onSegmentFileAddEvent = new GenericEvent<string>();

    private _name: string;
    private _url: string;
    private _options: StreamRecorderOptions;
    private _process: FFmpegProcess = new FFmpegProcess();
    private _sessionInfo: SessionInfo;
    private _fileWatcher: fs.FSWatcher | null = null;

    constructor(recorder: IStreamRecorder);
    constructor(url: string, options?: Partial<StreamRecorderOptions>);
    constructor(param1: string | IStreamRecorder, options?: Partial<StreamRecorderOptions>) {
        if (typeof param1 === 'string') {
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
                recorderId: this._id,
                sessionUnique: this._id,
                state:
                    this._options.cwd && fs.existsSync(this._options.cwd)
                        ? RecorderState.PAUSED
                        : RecorderState.INITIAL,
                segmentUnique: createUnique(),
                retries: 0,
            };
        } else {
            this._id = param1.id;
            this._name = param1.name;
            this._url = param1.url;
            this._options = { ...param1.options, ...options };
            this._sessionInfo = param1.sessionInfo;
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
        if (state === RecorderState.COMPLETED) {
            this._onCompleteEvent.trigger();
        }
        if (state === RecorderState.PROCESS_EXITED_ABNORMALLY) {
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
            this._process.isRunning() ||
            [
                RecorderState.RECORDING,
                RecorderState.STOPPING,
                RecorderState.CREATINGOUTFILE,
                RecorderState.CLEANING,
            ].includes(this._sessionInfo.state)
        );
    }

    /**
     * Gets a list of segment list files for the current
     * session which are used to create the output file.
     * @returns List of segment list files
     */
    public getSessionSegmentLists(): string[] {
        if (!this._options.cwd) {
            return [];
        }
        return findFiles(this._options.cwd, new RegExp(`seglist_${this._sessionInfo.sessionUnique}_\\d*\\.txt`));
    }

    /**
     * Gets a list of segment files for the current session.
     * @return List of segment files
     */
    public getSessionSegmentFiles(): string[] {
        if (!this._options.cwd) {
            return [];
        }
        return findFiles(this._options.cwd, new RegExp(`seg_${this._sessionInfo.sessionUnique}_\\d*_\\d*\\.ts`));
    }

    /**
     * Starts the recording.
     */
    public start() {
        if (this._process.isRunning()) {
            logger.warn('Process cannot be started because one is already running');
            return;
        }
        logger.debug('Starting recording');
        if (this._options.workDir && !fs.existsSync(this._options.workDir)) {
            fs.mkdirSync(this._options.workDir);
        }
        if (this._sessionInfo.state != RecorderState.PAUSED) {
            this.startNewSession();
        }
        this._sessionInfo.segmentUnique = createUnique();
        this.recordForSession();
    }

    /**
     * Pauses the recording.
     */
    public pause() {
        this.setState(RecorderState.PAUSED);
        this.killProcess();
    }

    /**
     * Stops the recording and creats the output file.
     */
    public stop(outfile?: string, onStoppedFinish?: () => void) {
        if (this._sessionInfo.state === RecorderState.COMPLETED) {
            return;
        }
        this.outFile = outfile ? outfile : path.join(this.options.workDir!, this.sessionInfo.sessionUnique + '.mp4');
        if (onStoppedFinish) {
            this.onComplete.on(onStoppedFinish);
        }
        this.setState(RecorderState.STOPPING);
        this.killProcess();
    }

    /**
     * Kills the current process. Alias for pause()
     */
    public kill() {
        this.pause();
    }

    private startNewSession() {
        this._process = new FFmpegProcess();

        logger.debug('Creating new session');
        this._sessionInfo.sessionUnique = createUnique();
        const { workDir } = this._options;
        if (!fs.existsSync(workDir)) {
            this.setState(RecorderState.ERROR);
            throw new Error(`Working directory '${workDir}' does not exist!`);
        }
        this._options.cwd = path.join(workDir, this._sessionInfo.sessionUnique);
        this._sessionInfo.cwd = this._options.cwd;
        if (!fs.existsSync(this._options.cwd)) {
            fs.mkdirSync(this._options.cwd);
        }
    }

    private finish() {
        if (!this.outFile) {
            logger.error('Cannot finish recording because no output file is specified');
            this.setState(RecorderState.ERROR);
            return;
        }
        if (this._fileWatcher) {
            this._fileWatcher.close();
        }
        logger.debug('Finishing recording');
        const dir = path.dirname(this.outFile);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }

        this.createOutputFile(this.outFile).then(() => {
            this.cleanWorkingDirectory();
            this.setState(RecorderState.COMPLETED);
        });
    }

    private killProcess() {
        this._process.kill();
    }

    private recordForSession() {
        this.setState(RecorderState.RECORDING);
        this._fileWatcher = fs.watch(this._options.cwd!, (eventType, filename) => {
            if (
                eventType === 'rename' &&
                filenameMatchesPattern(filename, new RegExp(`seg_${this._sessionInfo.sessionUnique}_\\d*_\\d*\\.ts`))
            ) {
                this._onSegmentFileAddEvent.trigger(filename);
            }
        });
        this._process.start(
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
                `seglist_${this._sessionInfo.sessionUnique}_${this._sessionInfo.segmentUnique
                    .toString()
                    .padStart(2, '0')}.txt`,
                '-segment_list_entry_prefix',
                'file ',
                `seg_${this._sessionInfo.sessionUnique}_${this._sessionInfo.segmentUnique
                    .toString()
                    .padStart(2, '0')}_%05d.ts`,
            ],
            {
                cwd: this._options.cwd,
                onExit: (result: FFmpegProcessResult) => {
                    if (!result.plannedKill) {
                        this.setState(RecorderState.PROCESS_EXITED_ABNORMALLY);
                        if (
                            this._options.retry &&
                            this._options.retry > 0 &&
                            this._sessionInfo.retries < this._options.retry
                        ) {
                            this._sessionInfo.retries = this._sessionInfo.retries + 1;
                            logger.debug(
                                `Process exited abnormally. Retry recording: ${this._sessionInfo.retries}/${this._options.retry}`
                            );
                            setTimeout(() => {
                                this.recordForSession();
                            }, 1000);
                        } else if (this._options.createOnExit) {
                            logger.debug(`Automatically creating output file because process exited abnormally`);
                            setTimeout(() => {
                                this.finish();
                            }, 1000);
                        }
                    } else if (this._sessionInfo.state !== RecorderState.PAUSED) {
                        setTimeout(() => {
                            this.finish();
                        }, 1000);
                    }
                },
            }
        );
    }

    private async createOutputFile(outfile: string): Promise<string | undefined> {
        return new MediaFileCreator(this._options.cwd!).create(outfile);
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
}
