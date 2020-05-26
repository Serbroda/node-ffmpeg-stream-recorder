// https://itnext.io/step-by-step-building-and-publishing-an-npm-typescript-package-44fe7164964c
// https://medium.com/@mtiller/debugging-with-typescript-jest-ts-jest-and-visual-studio-code-ef9ca8644132

import { spawn } from 'child_process';
import { ChildProcessWithoutNullStreams } from 'child_process';

export class FFmpegProcess {
    private readonly encoding: BufferEncoding = 'utf8';
    private readonly ffmpegExecutable: string;
    private process: ChildProcessWithoutNullStreams | null = null;

    constructor(ffmpegExecutable?: string) {
        this.ffmpegExecutable = ffmpegExecutable ? ffmpegExecutable : 'ffmpeg';
    }

    public start(
        args: string[],
        workdir?: string,
        onclose?: (code: number) => void
    ) {
        const cwd = workdir ? workdir : __dirname;
        this.process = spawn(this.ffmpegExecutable, args, {
            cwd,
        });
        this.process.stdin.setDefaultEncoding(this.encoding);
        this.process.stdout.setEncoding(this.encoding);
        this.process.stderr.setEncoding(this.encoding);

        this.process.stdin.on('data', this.printmsg);
        this.process.stdout.on('data', this.printmsg);
        this.process.stderr.on('data', this.printmsg);

        this.process.on('close', (code: number) => {
            console.log('process exit code ' + code);
            if (onclose) {
                onclose(code);
            }
        });
    }

    public stop() {
        if (this.process) {
            this.process.stdin.write('q');
            this.process.kill('SIGINT');
        }
    }

    public isRunning(): boolean {
        return this.process !== null && !this.process.killed;
    }

    private printmsg(data: any) {
        var str = data.toString();
        var lines = str.split(/(\r?\n)/g);
        console.log(lines.join(''));
    }
}
