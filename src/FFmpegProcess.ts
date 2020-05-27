// https://itnext.io/step-by-step-building-and-publishing-an-npm-typescript-package-44fe7164964c
// https://medium.com/@mtiller/debugging-with-typescript-jest-ts-jest-and-visual-studio-code-ef9ca8644132

import { spawn } from 'child_process';
import { ChildProcessWithoutNullStreams } from 'child_process';

type ProcessMessageSource = 'stdin' | 'stdout' | 'stderr';

export interface FFmpegProcessOptions {
    workDirectory?: string;
    messageEncoding?: BufferEncoding;
    printMessages?: boolean;
    onMessage?: (message: string, source: ProcessMessageSource) => void;
    onExit?: (code: number, signal: NodeJS.Signals) => void;
}

const defaultOptions: FFmpegProcessOptions = {
    workDirectory: __dirname,
    messageEncoding: 'utf8',
    printMessages: false,
};

export class FFmpegProcess {
    private readonly ffmpegExecutable: string;
    private process: ChildProcessWithoutNullStreams | null = null;
    private _exitCode: number = -1;

    constructor(ffmpegExecutable?: string) {
        this.ffmpegExecutable = ffmpegExecutable ? ffmpegExecutable : 'ffmpeg';
    }

    public isRunning(): boolean {
        return this.process !== null && !this.process.killed;
    }

    public get exitCode(): number {
        return this._exitCode;
    }

    public start(args: string[], options?: FFmpegProcessOptions) {
        const opt: FFmpegProcessOptions = { ...defaultOptions, ...options };
        this.process = spawn(this.ffmpegExecutable, args, {
            cwd: options?.workDirectory,
        });
        const encoding = opt.messageEncoding ? opt.messageEncoding : 'utf8';
        this.process.stdin.setDefaultEncoding(encoding);
        this.process.stdout.setEncoding(encoding);
        this.process.stderr.setEncoding(encoding);

        this.process.stdin.on('data', (data: any) =>
            this.handleMessage(data, 'stdin', opt)
        );
        this.process.stdout.on('data', (data: any) =>
            this.handleMessage(data, 'stdout', opt)
        );
        this.process.stderr.on('data', (data: any) =>
            this.handleMessage(data, 'stderr', opt)
        );

        this.process.on('close', (code: number, signal: NodeJS.Signals) => {
            console.log('process exit code ' + code);
            if (opt.onExit) {
                opt.onExit(code, signal);
            }
        });
    }

    public kill() {
        if (this.process) {
            this.process.stdin.write('q');
            this.process.kill('SIGINT');
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
