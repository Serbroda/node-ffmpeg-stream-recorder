import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import { configuration } from '../config';

const encoding = 'utf8';

export interface FFmprobeOptions {
    cwd: string;
}

export class FFprobeProcess {
    private _childProcess: ChildProcessWithoutNullStreams | null = null;

    exec(args: string[], options?: Partial<FFmprobeOptions>): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            const opt: FFmprobeOptions = { ...{ cwd: __dirname }, ...options };

            this._childProcess = spawn('ffprobe', args, {
                cwd: opt.cwd,
            });
            this._childProcess.stdin.setDefaultEncoding(encoding);
            this._childProcess.stdout.setEncoding(encoding);
            this._childProcess.stderr.setEncoding(encoding);

            let result: string = '';

            this._childProcess.stdin.on('data', (data: any) => (result = result + this.parseMessage(data)));
            this._childProcess.stdout.on('data', (data: any) => (result = result + this.parseMessage(data)));
            this._childProcess.stderr.on('data', (data: any) => (result = result + this.parseMessage(data)));
            this._childProcess.once('close', (code: number, signal: NodeJS.Signals) => {
                resolve(result);
            });
        });
    }

    private parseMessage(data: any) {
        let str = data.toString();
        let lines = str.split(/(\r?\n)/g);
        let msg = lines.join('');

        return msg;
    }
}
