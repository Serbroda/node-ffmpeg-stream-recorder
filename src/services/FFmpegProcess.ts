import { spawn } from 'child_process';
import { ChildProcessWithoutNullStreams } from 'child_process';
import { sleep } from '../helpers/ThreadingHelper';
import { GenericEvent, IGenericEvent } from '../helpers/GenericEvent';
import { configuration } from '../config';
import { mkdir } from '../helpers/FileHelper';

const encoding = 'utf8';

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
    checkExitContinuously?: boolean;
}

export class FFmpegProcess {
    private readonly _onExitEvent = new GenericEvent<FFmpegProcessResult>();
    private readonly _onExitAbnormallyEvent = new GenericEvent<FFmpegProcessResult>();
    private readonly _onMessageEvent = new GenericEvent<string>();
    private readonly _checkExitContinuouslyTimeout = 30000;

    private _childProcess: ChildProcessWithoutNullStreams | null = null;
    private _exitCode: number = -1;
    private _plannedKill: boolean = false;
    private _startedAt: Date | null = null;
    private _exitedAt: Date | null = null;
    private _checkExitContinuouslyInterval: any | undefined;
    private _exitHandled: boolean = false;

    constructor() {}

    public get onExit(): IGenericEvent<FFmpegProcessResult> {
        return this._onExitEvent.expose();
    }

    public get onExitAbnormally(): IGenericEvent<FFmpegProcessResult> {
        return this._onExitAbnormallyEvent.expose();
    }

    public get onMessage(): IGenericEvent<string> {
        return this._onMessageEvent.expose();
    }

    public get pid(): number | undefined {
        return this._childProcess?.pid;
    }

    public get exitCode(): number {
        return this._exitCode;
    }

    public get startedAt(): Date | null {
        return this._startedAt;
    }

    public get exitedAt(): Date | null {
        return this._exitedAt;
    }

    public isRunning(): boolean {
        return this._childProcess !== null && !this._childProcess.killed;
    }

    public async startAsync(args: string[], options?: Partial<FFmpegProcessOptions>): Promise<FFmpegProcessResult> {
        return new Promise<FFmpegProcessResult>((resolve, reject) => {
            try {
                this.onExit.once((result: FFmpegProcessResult) => {
                    resolve(result);
                });
                this.start(args, options);
            } catch (error) {
                reject(error);
            }
        });
    }

    public start(args: string[], options?: Partial<FFmpegProcessOptions>) {
        const opt: FFmpegProcessOptions = { ...{ cwd: __dirname }, ...options };

        if (!this.waitForProcessKilled(500)) {
            throw new Error('Process seems to be busy. Kill the process before starting a new one');
        }

        mkdir(opt.cwd);

        if (options?.onExit) {
            this.onExit.on(options.onExit);
        }
        if (options?.onMessage) {
            this.onMessage.on(options.onMessage);
        }

        this._plannedKill = false;
        this._startedAt = new Date();
        this._exitedAt = null;

        this._childProcess = spawn(configuration.executable, args, {
            cwd: opt.cwd,
        });
        this._childProcess.stdin.setDefaultEncoding(encoding);
        this._childProcess.stdout.setEncoding(encoding);
        this._childProcess.stderr.setEncoding(encoding);

        this._childProcess.stdin.on('data', (data: any) => this.handleMessage(data));
        this._childProcess.stdout.on('data', (data: any) => this.handleMessage(data));
        this._childProcess.stderr.on('data', (data: any) => this.handleMessage(data));

        this._exitHandled = false;
        if (this._checkExitContinuouslyInterval) {
            clearInterval(this._checkExitContinuouslyInterval);
        }
        if (opt.checkExitContinuously) {
            this._checkExitContinuouslyInterval = setInterval(() => {
                if (!this.isRunning && !this._exitHandled) {
                    this.handleExit(-99, 'SIGINT', opt);
                }
            }, this._checkExitContinuouslyTimeout);
        }
        this._childProcess.once('close', (code: number, signal: NodeJS.Signals) => {
            this.handleExit(code, signal, opt);
        });
    }

    public async killAsync(timeout: number = 2000): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.kill();
            let killed = this.waitForProcessKilled(timeout);
            if (killed) {
                setTimeout(() => {
                    resolve();
                }, 500);
            } else {
                reject(new Error('Process did not exited in time'));
            }
        });
    }

    public kill() {
        this._plannedKill = true;
        this.killProcess();
    }

    private killProcess() {
        if (this._childProcess && !this._childProcess.killed) {
            if (!this._childProcess.stdin.destroyed) {
                this._childProcess.stdin.write('q');
            }
            this._childProcess.kill('SIGINT');
        }
    }

    public waitForProcessKilled(timeoutMillis?: number): boolean {
        if (!this._childProcess) {
            return true;
        }

        let counter = 0;
        let millis = timeoutMillis ? timeoutMillis / 10 : -1;
        while (!this._childProcess.killed && (millis < 1 || counter < millis)) {
            sleep(10);
            counter++;
        }
        return this._childProcess.killed;
    }

    public handleExit(exitCode: number, signal: NodeJS.Signals, options: FFmpegProcessOptions) {
        if (this._exitHandled) {
            return;
        }

        this._exitedAt = new Date();

        const result: FFmpegProcessResult = {
            exitCode: exitCode,
            plannedKill: this._plannedKill,
            startedAt: this._startedAt,
            exitedAt: this._exitedAt,
            signal: signal,
            options: options,
        };
        this._childProcess = null;
        this._onExitEvent.trigger(result, 200);
        if (!result.plannedKill) {
            this._onExitAbnormallyEvent.trigger(result, 200);
        }
        this._exitHandled = true;
    }

    private handleMessage(data: any) {
        let str = data.toString();
        let lines = str.split(/(\r?\n)/g);
        let msg = lines.join('');

        this._onMessageEvent.trigger(msg);
    }
}
