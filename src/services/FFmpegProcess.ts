// https://itnext.io/step-by-step-building-and-publishing-an-npm-typescript-package-44fe7164964c
// https://medium.com/@mtiller/debugging-with-typescript-jest-ts-jest-and-visual-studio-code-ef9ca8644132

import { spawn } from 'child_process';
import { ChildProcessWithoutNullStreams } from 'child_process';

type ProcessMessageSource = 'stdin' | 'stdout' | 'stderr';

const encoding = 'utf8';

export interface FFmpegProcessOptions {
    workDirectory?: string;
    printMessages?: boolean;
    onMessage?: (message: string, source: ProcessMessageSource) => void;
    onExit?: (code: number, planned?: boolean, signal?: NodeJS.Signals) => void;
}

const defaultOptions: FFmpegProcessOptions = {
    workDirectory: __dirname,
    printMessages: false,
};

export class FFmpegProcess {
    private readonly _executable: string;
    private _childProcess: ChildProcessWithoutNullStreams | null = null;
    private _exitCode: number = -1;
    private _plannedExit: boolean = false;

    constructor(ffmpegExecutable?: string) {
        this._executable = ffmpegExecutable ? ffmpegExecutable : 'ffmpeg';
    }

    public isRunning(): boolean {
        return this._childProcess !== null && !this._childProcess.killed;
    }

    public get exitCode(): number {
        return this._exitCode;
    }

    public start(args: string[], options?: FFmpegProcessOptions) {
        const opt: FFmpegProcessOptions = { ...defaultOptions, ...options };
        this._plannedExit = false;

        this._childProcess = spawn(this._executable, args, {
            cwd: options?.workDirectory,
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
                if (options?.printMessages) {
                    console.log('process exit code ' + code);
                }
                if (opt.onExit) {
                    opt.onExit(code, this._plannedExit, signal);
                }
                this._childProcess = null;
            }
        );
    }

    public kill() {
        if (this._childProcess) {
            this._plannedExit = true;
            this._childProcess.stdin.write('q');
            this._childProcess.kill('SIGINT');
        }
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
