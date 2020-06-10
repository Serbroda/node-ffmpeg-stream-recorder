import { RecorderState } from '../models/RecorderState';
export interface SessionInfo {
    recorderId: string;
    sessionUnique: string;
    state: RecorderState;
    startCounter: number;
    retries: number;
}
export interface RecorderStandardOptions {
    ffmpegExecutable?: string;
    workingDirectory?: string;
    generateSubdirectoryForSession?: boolean;
    printMessages?: boolean;
    cleanSegmentFiles?: boolean;
    ensureDirectoryExists?: boolean;
    retryTimesIfRecordingExitedAbnormally?: number;
    automaticallyCreateOutfileIfExitedAbnormally?: boolean;
}
export interface RecorderOptions extends RecorderStandardOptions {
    outfile?: string;
    onStart?: () => void;
    onComplete?: () => void;
    onStateChange?: (newState: RecorderState, oldState?: RecorderState, sessionInfo?: SessionInfo) => void;
}
export declare const defaultRecorderOptions: RecorderOptions;
export declare class Recorder {
    private readonly _id;
    private _url;
    private _options;
    private _process?;
    private _currentWorkingDirectory?;
    private _sessionInfo;
    constructor(url: string, options?: RecorderOptions);
    /**
     * Unique recorder id e.g 19112814560452.
     */
    get id(): string;
    /**
     * Informations about the current session.
     */
    get sessionInfo(): SessionInfo;
    /**
     * The current state.
     */
    get state(): RecorderState;
    /**
     * The URL to be recorded.
     */
    get url(): string;
    /**
     * Sets the URL to record.
     * @param url Stream URL
     */
    set url(url: string);
    /**
     * The options for the recorder.
     */
    get options(): RecorderOptions;
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
     * @param url Stream URL
     */
    start(url?: string): void;
    /**
     * Pauses the recording.
     */
    pause(): void;
    /**
     * Stops the recording and creats the output file.
     * @param outfile Target output filename
     */
    stop(outfile?: string): void;
    private killProcess;
    private recordForSession;
    private createOutputFile;
    private mergeSegmentLists;
    private cleanWorkingDirectory;
}
