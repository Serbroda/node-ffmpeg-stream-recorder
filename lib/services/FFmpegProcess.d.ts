/// <reference types="node" />
declare type ProcessMessageSource = 'stdin' | 'stdout' | 'stderr';
export interface FFmpegProcessOptions {
    workDirectory?: string;
    printMessages?: boolean;
    onMessage?: (message: string, source: ProcessMessageSource) => void;
    onExit?: (code: number, planned?: boolean, signal?: NodeJS.Signals) => void;
}
export declare class FFmpegProcess {
    private readonly _executable;
    private _childProcess;
    private _exitCode;
    private _plannedExit;
    constructor(executable?: string);
    isRunning(): boolean;
    get exitCode(): number;
    start(args: string[], options?: FFmpegProcessOptions): void;
    kill(): void;
    private handleMessage;
}
export {};
