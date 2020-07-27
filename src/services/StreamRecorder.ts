import { getLogger } from '@log4js-node/log4js-api';
import * as fs from 'fs';
import { dirname, join } from 'path';
import { deleteFolderRecursive, findFiles, filenameMatchesPattern } from '../helpers/FileHelper';
import { createUnique } from '../helpers/UniqueHelper';
import { RecorderState } from '../models/RecorderState';
import { FFmpegProcess, FFmpegProcessResult } from './FFmpegProcess';
import { GenericEvent, IGenericEvent } from '../helpers/GenericEvent';
import { MediaFileCreator } from './MediaFileCreator';

const logger = getLogger('ffmpeg-stream-recorder');

export interface SessionInfo {
    recorderId: string;
    sessionUnique: string;
    state: RecorderState;
    startCounter: number;
    retries: number;
    cwd?: string;
}

export interface StreamRecorderStandardOptions {
    workingDirectory: string;
    cleanSegmentFiles: boolean;
    ensureDirectoryExists: boolean;
    retryTimesIfRecordingExitedAbnormally: number;
    automaticallyCreateOutfileIfExitedAbnormally: boolean;
}

export interface StreamRecorderOptions extends StreamRecorderStandardOptions {
    outfile?: string;
    onStart?: (sessionInfo?: SessionInfo) => void;
    onComplete?: () => void;
    onStateChange?: (data: { newState: RecorderState; oldState?: RecorderState; sessionInfo?: SessionInfo }) => void;
}

export const defaultOptions: StreamRecorderOptions = {
    workingDirectory: __dirname,
    cleanSegmentFiles: true,
    ensureDirectoryExists: true,
    retryTimesIfRecordingExitedAbnormally: 0,
    automaticallyCreateOutfileIfExitedAbnormally: true,
};

export class StreamRecorder {
    private readonly _id: string;

    private readonly _onStartEvent = new GenericEvent<SessionInfo>();
    private readonly _onCompleteEvent = new GenericEvent<void>();
    private readonly _onStateChangeEvent = new GenericEvent<{
        newState: RecorderState;
        oldState?: RecorderState;
        sessionInfo?: SessionInfo;
    }>();
    private readonly _onSegmentFileAddEvent = new GenericEvent<string>();

    private _url: string;
    private _options: StreamRecorderOptions;
    private _process: FFmpegProcess;
    private _currentWorkingDirectory?: string;
    private _sessionInfo: SessionInfo;
    private _completed: (() => void) | undefined;
    private _fileWatcher: fs.FSWatcher | null = null;

    constructor(url: string, options?: Partial<StreamRecorderOptions>) {
        this._id = createUnique();
        this._url = url;
        this._options = {
            ...{
                workingDirectory: __dirname,
                cleanSegmentFiles: true,
                ensureDirectoryExists: true,
                retryTimesIfRecordingExitedAbnormally: 0,
                automaticallyCreateOutfileIfExitedAbnormally: true,
                debug: false,
            },
            ...options,
        };
        this._process = new FFmpegProcess();
        this._sessionInfo = {
            recorderId: this._id,
            sessionUnique: this._id,
            state: RecorderState.INITIAL,
            startCounter: 0,
            retries: 0,
        };

        if (options?.onStart) {
            this.onStart.on(options.onStart);
        }
        if (options?.onComplete) {
            this.onComplete.on(options.onComplete);
        }
        if (options?.onStateChange) {
            this.onStateChange.on(options.onStateChange);
        }
    }

    public get onStart(): IGenericEvent<SessionInfo> {
        return this._onStartEvent.expose();
    }

    public get onComplete(): IGenericEvent<void> {
        return this._onCompleteEvent.expose();
    }

    public get onStateChange(): IGenericEvent<{
        newState: RecorderState;
        oldState?: RecorderState;
        sessionInfo?: SessionInfo;
    }> {
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
        if (state == RecorderState.RECORDING) {
            this._onStartEvent.trigger(this.sessionInfo);
        }
        if (state == RecorderState.COMPLETED) {
            this._onCompleteEvent.trigger();
            if (this._completed) {
                this._completed();
            }
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
        if (!this._currentWorkingDirectory) {
            return [];
        }
        return findFiles(
            this._currentWorkingDirectory,
            new RegExp(`seglist_${this._sessionInfo.sessionUnique}_\\d*\\.txt`)
        );
    }

    /**
     * Gets a list of segment files for the current session.
     * @return List of segment files
     */
    public getSessionSegmentFiles(): string[] {
        if (!this._currentWorkingDirectory) {
            return [];
        }
        return findFiles(
            this._currentWorkingDirectory,
            new RegExp(`seg_${this._sessionInfo.sessionUnique}_\\d*_\\d*\\.ts`)
        );
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
        if (
            this._options.ensureDirectoryExists &&
            this._options.workingDirectory &&
            !fs.existsSync(this._options.workingDirectory)
        ) {
            fs.mkdirSync(this._options.workingDirectory);
        }
        if (this._sessionInfo.state != RecorderState.PAUSED) {
            this.startNewSession();
        }
        this._sessionInfo.startCounter = this._sessionInfo.startCounter + 1;
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
    public stop(outfile?: string, onComplete?: () => void) {
        if (this._sessionInfo.state === RecorderState.COMPLETED) {
            return;
        }
        if (outfile) {
            this.outFile = outfile;
        }
        if (!this.outFile) {
            this.outFile = join(this.options.workingDirectory!, this.sessionInfo.sessionUnique + '.mp4');
        }
        this._completed = onComplete;
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
        const workDir = this._options.workingDirectory ? this._options.workingDirectory : __dirname;
        if (!fs.existsSync(workDir)) {
            this.setState(RecorderState.ERROR);
            throw new Error(`Working directory '${workDir}' does not exist!`);
        }
        this._currentWorkingDirectory = join(workDir, this._sessionInfo.sessionUnique);
        this._sessionInfo.cwd = this._currentWorkingDirectory;
        if (!fs.existsSync(this._currentWorkingDirectory)) {
            fs.mkdirSync(this._currentWorkingDirectory);
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
        const dir = dirname(this.outFile);
        if (this._options.ensureDirectoryExists && !fs.existsSync(dir)) {
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
        this._fileWatcher = fs.watch(this._currentWorkingDirectory!, (eventType, filename) => {
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
                `seglist_${this._sessionInfo.sessionUnique}_${this._sessionInfo.startCounter
                    .toString()
                    .padStart(2, '0')}.txt`,
                '-segment_list_entry_prefix',
                'file ',
                `seg_${this._sessionInfo.sessionUnique}_${this._sessionInfo.startCounter
                    .toString()
                    .padStart(2, '0')}_%05d.ts`,
            ],
            {
                cwd: this._currentWorkingDirectory,
                onExit: (result: FFmpegProcessResult) => {
                    if (!result.plannedKill) {
                        this.setState(RecorderState.PROCESS_EXITED_ABNORMALLY);
                        if (
                            this._options.retryTimesIfRecordingExitedAbnormally &&
                            this._options.retryTimesIfRecordingExitedAbnormally > 0 &&
                            this._sessionInfo.retries < this._options.retryTimesIfRecordingExitedAbnormally
                        ) {
                            this._sessionInfo.retries = this._sessionInfo.retries + 1;
                            logger.debug(
                                `Process exited abnormally. Retry recording: ${this._sessionInfo.retries}/${this._options.retryTimesIfRecordingExitedAbnormally}`
                            );
                            setTimeout(() => {
                                this.recordForSession();
                            }, 1000);
                        } else if (this._options.automaticallyCreateOutfileIfExitedAbnormally) {
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
        return new MediaFileCreator(this._currentWorkingDirectory!).create(outfile);
    }

    private cleanWorkingDirectory() {
        if (
            !this._options.cleanSegmentFiles ||
            !this._currentWorkingDirectory ||
            !fs.existsSync(this._currentWorkingDirectory)
        ) {
            return;
        }
        logger.debug('Cleaning working directory ' + this._currentWorkingDirectory);
        setTimeout(() => {
            deleteFolderRecursive(this._currentWorkingDirectory!, false);
        }, 1000);
    }
}
