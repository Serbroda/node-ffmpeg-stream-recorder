// https://itnext.io/step-by-step-building-and-publishing-an-npm-typescript-package-44fe7164964c
// https://medium.com/@mtiller/debugging-with-typescript-jest-ts-jest-and-visual-studio-code-ef9ca8644132

import { spawn } from 'child_process';
import { ChildProcessWithoutNullStreams } from 'child_process';
import { sleep } from '../helpers/ThreadingHelper';

type ProcessMessageSource = 'stdin' | 'stdout' | 'stderr';

const encoding = 'utf8';

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

const defaultProcessOptions: FFmpegProcessOptions = {
    workDirectory: __dirname,
    printMessages: false,
};

export class FFmpegProcess {
    private readonly _executable: string;
    private _childProcess: ChildProcessWithoutNullStreams | null = null;
    private _exitCode: number = -1;
    private _plannedKill: boolean = false;
    private _startedAt: Date | null = null;
    private _exitedAt: Date | null = null;

    constructor(executable?: string) {
        this._executable = executable ? executable : 'ffmpeg';
    }

    public isRunning(): boolean {
        return this._childProcess !== null && !this._childProcess.killed;
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

    public start(args: string[], options?: FFmpegProcessOptions) {
        if (!this.waitForProcessKilled(500)) {
            throw new Error(
                'Process seems to be busy. Kill the process before starting a new one'
            );
        }
        const opt: FFmpegProcessOptions = {
            ...defaultProcessOptions,
            ...options,
        };
        this._plannedKill = false;
        this._startedAt = new Date();
        this._exitedAt = null;

        this._childProcess = spawn(this._executable, args, {
            cwd: opt.workDirectory,
        });
        this._childProcess.stdin.setDefaultEncoding(encoding);
        this._childProcess.stdout.setEncoding(encoding);
        this._childProcess.stderr.setEncoding(encoding);

        this._childProcess.stdin.on('data', (data: any) =>
            this.handleMessage(data, 'stdin', opt)
        );
        this._childProcess.stdout.on('data', (data: any) =>
            this.handleMessage(data, 'stdout', opt)
        );
        this._childProcess.stderr.on('data', (data: any) =>
            this.handleMessage(data, 'stderr', opt)
        );

        this._childProcess.on(
            'close',
            (code: number, signal: NodeJS.Signals) => {
                this._exitedAt = new Date();

                if (options?.printMessages) {
                    console.log('Process exited with code ' + code);
                }
                if (opt.onExit) {
                    opt.onExit({
                        exitCode: code,
                        plannedKill: this._plannedKill,
                        startedAt: this._startedAt,
                        exitedAt: this._exitedAt,
                        signal: signal,
                        options: opt,
                    });
                }
                this._childProcess = null;
            }
        );
    }

    public kill() {
        if (this._childProcess && !this._childProcess.killed) {
            this._plannedKill = true;
            if (!this._childProcess.stdin.destroyed) {
                this._childProcess.stdin.write('q');
            }
            this._childProcess.kill('SIGINT');

            this.waitForProcessKilled(500);
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

    private handleMessage(
        data: any,
        source: ProcessMessageSource,
        options?: FFmpegProcessOptions
    ) {
        let str = data.toString();
        let lines = str.split(/(\r?\n)/g);
        let msg = lines.join('');

        if (options?.printMessages) {
            console.log(msg);
        }
        if (options?.onMessage) {
            options?.onMessage(msg, source);
        }
    }
}
