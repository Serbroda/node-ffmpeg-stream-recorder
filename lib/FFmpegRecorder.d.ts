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
    unique: string;
    state: FFmpegRecorderState;
    startCounter: number;
}
export interface FFmpegRecorderOptions {
    ffmpegExecutable?: string;
    outfile?: string;
    workingDirectory?: string;
    generateSubdirectoryForSession?: boolean;
    printMessages?: boolean;
    cleanSegmentFiles?: boolean;
    onStart?: () => void;
    onComplete?: () => void;
    onStateChange?: (newState: FFmpegRecorderState, oldState?: FFmpegRecorderState, sessionInfo?: FFmpegSessionInfo) => void;
}
export declare class FFmpegRecorder {
    private readonly _id;
    private _url;
    private _options;
    private _process;
    private _currentWorkingDirectory;
    private _sessionInfo;
    constructor(url: string, options?: FFmpegRecorderOptions);
    get sessionInfo(): FFmpegSessionInfo;
    get state(): FFmpegRecorderState;
    get url(): string;
    set url(url: string);
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
