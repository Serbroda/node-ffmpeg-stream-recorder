/// <reference types="node" />
declare type ProcessMessageSource = 'stdin' | 'stdout' | 'stderr';
export interface FFmpegProcessResult {
    exitCode: number | null;
    signal?: NodeJS.Signals;
    plannedKill: boolean;
    startedAt: Date | null;
    exitedAt: Date | null;
    options?: FFmpegProcessOptions;
}
export interface FFmpegProcessOptions {
    workDirectory?: string;
    printMessages?: boolean;
    onMessage?: (message: string, source: ProcessMessageSource) => void;
    onExit?: (result: FFmpegProcessResult) => void;
}
export declare class FFmpegProcess {
    private readonly _executable;
    private _childProcess;
    private _exitCode;
    private _plannedKill;
    private _startedAt;
    private _exitedAt;
    constructor(executable?: string);
    isRunning(): boolean;
    get pid(): number | undefined;
    get exitCode(): number;
    get startedAt(): Date | null;
    get exitedAt(): Date | null;
    start(args: string[], options?: FFmpegProcessOptions): void;
    kill(): void;
    waitForProcessKilled(timeoutMillis?: number): boolean;
    private handleMessage;
}
export {};
