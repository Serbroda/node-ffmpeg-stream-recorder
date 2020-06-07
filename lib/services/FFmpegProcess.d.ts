/// <reference types="node" />
declare type ProcessMessageSource = 'stdin' | 'stdout' | 'stderr';
export interface FFmpegProcessOptions {
    workDirectory?: string;
    messageEncoding?: BufferEncoding;
    printMessages?: boolean;
    onMessage?: (message: string, source: ProcessMessageSource) => void;
    onExit?: (code: number, signal?: NodeJS.Signals) => void;
}
export declare class FFmpegProcess {
    private readonly ffmpegExecutable;
    private process;
    private _exitCode;
    constructor(ffmpegExecutable?: string);
    isRunning(): boolean;
    get exitCode(): number;
    start(args: string[], options?: FFmpegProcessOptions): void;
    kill(): void;
    private handleMessage;
}
export {};
