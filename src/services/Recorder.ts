import { FFmpegProcess } from './FFmpegProcess';
import * as path from 'path';

export class Recorder {
    private _recorderProcess: FFmpegProcess | undefined;

    constructor() {}

    public async start(url: string, outfile: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const dir = path.dirname(outfile);
            const ext = path.extname(outfile);
            const name = path.basename(outfile, ext);

            const tempOutFile = path.join(dir, `${name}.ts`);

            this._recorderProcess = new FFmpegProcess();
            this._recorderProcess.onExit.once((recordResult) => {
                console.log('Recording exited');
                if (ext !== '.ts') {
                    console.log('Converting');
                    const convertProcess = new FFmpegProcess();
                    convertProcess.onExit.once((convertResult) => {
                        console.log('Resolving');
                        resolve();
                    });
                    convertProcess.start(['-i', tempOutFile, '-acodec', 'copy', '-vcodec', 'copy', outfile]);
                } else {
                    console.log('Resolving');
                    resolve();
                }
            });
            this._recorderProcess.start(['-i', url, '-c:v', 'copy', '-c:a', 'copy', tempOutFile]);
        });
    }

    public stop() {
        console.log('Stopping...');
        this._recorderProcess!.kill();
    }
}
