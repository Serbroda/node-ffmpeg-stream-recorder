export declare enum FFmpegRecorderState {
    INITIAL = "INITIAL",
    RECORDING = "RECORDING",
    PAUSED = "PAUSED",
    STOPPING = "STOPPING",
    CREATINGOUTFILE = "CREATINGOUTFILE",
    CLEANING = "CLEANING",
    FINISH = "FINISH"
}
export interface FFmpegSessionInfo {
    id: string;
    unique: string;
    state: FFmpegRecorderState;
    startCounter: number;
}
export interface FFmpegRecorderStandardOptions {
    ffmpegExecutable?: string;
    outfile?: string;
    workingDirectory?: string;
    generateSubdirectoryForSession?: boolean;
    printMessages?: boolean;
    cleanSegmentFiles?: boolean;
    ensureDirectoryExists?: boolean;
}
export interface FFmpegRecorderOptions extends FFmpegRecorderStandardOptions {
    onStart?: () => void;
    onComplete?: () => void;
    onStateChange?: (newState: FFmpegRecorderState, oldState?: FFmpegRecorderState, sessionInfo?: FFmpegSessionInfo) => void;
}
export declare const defaultFFmpegRecorderOptions: FFmpegRecorderOptions;
export declare class FFmpegRecorder {
    private readonly _id;
    private _url;
    private _options;
    private _process;
    private _currentWorkingDirectory;
    private _sessionInfo;
    constructor(url: string, options?: FFmpegRecorderOptions);
    get id(): string;
    get sessionInfo(): FFmpegSessionInfo;
    get state(): FFmpegRecorderState;
    get url(): string;
    set url(url: string);
    get options(): FFmpegRecorderOptions;
    private setState;
    isBusy(): boolean;
    sessionSegmentLists(): string[];
    sessionSegmentFiles(): string[];
    start(): void;
    pause(): void;
    stop(outfile?: string): void;
    private killProcess;
    private recordForSession;
    private createOutputFile;
    private mergeSegmentLists;
    private cleanWorkingDirectory;
}
