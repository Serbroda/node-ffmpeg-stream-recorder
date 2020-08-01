// https://itnext.io/step-by-step-building-and-publishing-an-npm-typescript-package-44fe7164964c
// https://medium.com/@mtiller/debugging-with-typescript-jest-ts-jest-and-visual-studio-code-ef9ca8644132

import { spawn } from 'child_process';
import { ChildProcessWithoutNullStreams } from 'child_process';
import { sleep } from '../helpers/ThreadingHelper';
import { getLogger } from '@log4js-node/log4js-api';
import { GenericEvent, IGenericEvent } from '../helpers/GenericEvent';
import { configuration } from '../config';
import * as fs from 'fs';
import { mkdir } from '../helpers/FileHelper';

const logger = getLogger('ffmpeg-stream-recorder');

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
}

export class FFmpegProcess {
    private readonly _onExitEvent = new GenericEvent<FFmpegProcessResult>();
    private readonly _onExitAbnormallyEvent = new GenericEvent<FFmpegProcessResult>();
    private readonly _onMessageEvent = new GenericEvent<string>();

    private _childProcess: ChildProcessWithoutNullStreams | null = null;
    private _exitCode: number = -1;
    private _plannedKill: boolean = false;
    private _startedAt: Date | null = null;
    private _exitedAt: Date | null = null;

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

        logger.debug('Starting ffmpeg process with ', {
            args,
            options: opt,
        });

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

        this._childProcess.on('close', (code: number, signal: NodeJS.Signals) => {
            this._exitedAt = new Date();

            const result: FFmpegProcessResult = {
                exitCode: code,
                plannedKill: this._plannedKill,
                startedAt: this._startedAt,
                exitedAt: this._exitedAt,
                signal: signal,
                options: opt,
            };
            logger.debug('Process exited with result', result);
            this._childProcess = null;
            this._onExitEvent.trigger(result, 200);
            if (!result.plannedKill) {
                this._onExitAbnormallyEvent.trigger(result, 200);
            }
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
        if (this._childProcess && !this._childProcess.killed) {
            this._plannedKill = true;
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

    private handleMessage(data: any) {
        let str = data.toString();
        let lines = str.split(/(\r?\n)/g);
        let msg = lines.join('');

        logger.trace(msg);
        this._onMessageEvent.trigger(msg);
    }
}
