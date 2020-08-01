/// <reference types="node" />
import { IGenericEvent } from '../helpers/GenericEvent';
export interface FFmpegProcessResult {
    exitCode: number;
    signal?: NodeJS.Signals;
    plannedKill: boolean;
    startedAt: Date | null;
    exitedAt: Date | null;
    options?: FFmpegProcessOptions;
}
export interface FFmpegProcessOptions {
    cwd: string;
    onMessage?: (message: string) => void;
    onExit?: (result: FFmpegProcessResult) => void;
    onExitAbnormally?: (result: FFmpegProcessResult) => void;
}
export declare class FFmpegProcess {
    private readonly _onExitEvent;
    private readonly _onExitAbnormallyEvent;
    private readonly _onMessageEvent;
    private _childProcess;
    private _exitCode;
    private _plannedKill;
    private _startedAt;
    private _exitedAt;
    constructor();
    get onExit(): IGenericEvent<FFmpegProcessResult>;
    get onExitAbnormally(): IGenericEvent<FFmpegProcessResult>;
    get onMessage(): IGenericEvent<string>;
    get pid(): number | undefined;
    get exitCode(): number;
    get startedAt(): Date | null;
    get exitedAt(): Date | null;
    isRunning(): boolean;
    startAsync(args: string[], options?: Partial<FFmpegProcessOptions>): Promise<FFmpegProcessResult>;
    start(args: string[], options?: Partial<FFmpegProcessOptions>): void;
    killAsync(timeout?: number): Promise<void>;
    kill(): void;
    private killProcess;
    waitForProcessKilled(timeoutMillis?: number): boolean;
    private handleMessage;
}
