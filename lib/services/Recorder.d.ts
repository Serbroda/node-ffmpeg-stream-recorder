import { RecorderState } from '../models/RecorderState';
import { IGenericEvent } from '../helpers/GenericEvent';
export interface SessionInfo {
    recorderId: string;
    sessionUnique: string;
    state: RecorderState;
    startCounter: number;
    retries: number;
    cwd?: string;
}
export interface StreamRecorderStandardOptions {
    ffmpegExecutable?: string;
    workingDirectory?: string;
    cleanSegmentFiles?: boolean;
    ensureDirectoryExists?: boolean;
    retryTimesIfRecordingExitedAbnormally?: number;
    automaticallyCreateOutfileIfExitedAbnormally?: boolean;
    debug?: boolean;
}
export interface StreamRecorderOptions extends StreamRecorderStandardOptions {
    outfile?: string;
    onStart?: (sessionInfo?: SessionInfo) => void;
    onComplete?: () => void;
    onStateChange?: (data: {
        newState: RecorderState;
        oldState?: RecorderState;
        sessionInfo?: SessionInfo;
    }) => void;
}
export declare const defaultOptions: StreamRecorderOptions;
export declare class StreamRecorder {
    private readonly _id;
    private readonly _onStartEvent;
    private readonly _onCompleteEvent;
    private readonly _onStateChangeEvent;
    private _url;
    private _options;
    private _process;
    private _currentWorkingDirectory?;
    private _sessionInfo;
    private _completed;
    get onStart(): IGenericEvent<SessionInfo>;
    get onComplete(): IGenericEvent<void>;
    get onStateChange(): IGenericEvent<{
        newState: RecorderState;
        oldState?: RecorderState;
        sessionInfo?: SessionInfo;
    }>;
    constructor(url: string, options?: StreamRecorderOptions);
    /**
     * Unique recorder id e.g 19112814560452.
     */
    get id(): string;
    /**
     * The options for the recorder.
     */
    get options(): StreamRecorderOptions;
    /**
     * Informations about the current session.
     */
    get sessionInfo(): SessionInfo;
    /**
     * Gets the current recorder state.
     */
    get state(): RecorderState;
    /**
     * Sets the URL to record.
     * @param url Stream URL
     */
    set url(url: string);
    /**
     * The URL to be recorded.
     */
    get url(): string;
    /**
     * Sets the output file.
     * @param outFile Outfile
     */
    set outFile(outFile: string | undefined);
    /**
     * Gets the defined output file.
     */
    get outFile(): string | undefined;
    private setState;
    /**
     * Gets true if recorder is currently busy or false if not.
     * @returns Busy true/false
     */
    isBusy(): boolean;
    /**
     * Gets a list of segment list files for the current
     * session which are used to create the output file.
     * @returns List of segment list files
     */
    getSessionSegmentLists(): string[];
    /**
     * Gets a list of segment files for the current session.
     * @return List of segment files
     */
    getSessionSegmentFiles(): string[];
    /**
     * Starts the recording.
     */
    start(): void;
    /**
     * Pauses the recording.
     */
    pause(): void;
    /**
     * Stops the recording and creats the output file.
     */
    stop(outfile?: string, onComplete?: () => void): void;
    /**
     * Kills the current process. Alias for pause()
     */
    kill(): void;
    private startNewSession;
    private finish;
    private killProcess;
    private recordForSession;
    private createOutputFile;
    private mergeSegmentLists;
    private cleanWorkingDirectory;
}
