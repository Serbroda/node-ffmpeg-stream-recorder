import * as path from 'path';
import { FFmpegProcess, FFmpegProcessResult } from './services/FFmpegProcess';

console.log('Args', process.argv);

async function record() {
    return new Promise<void>((resolve, reject) => {
        new FFmpegProcess().start(
            [
                '-y',
                '-i',
                'https://test-streams.mux.dev/pts_shift/master.m3u8',
                '-c:v',
                'copy',
                '-c:a',
                'copy',
                '-f',
                'segment',
                '-segment_list',
                'out.ffcat',
                'seg_%03d.ts',
            ],
            {
                cwd: path.join(__dirname, '/out'),
                onExit: (result: FFmpegProcessResult) => {
                    resolve();
                },
            }
        );
    });
}

if (process.argv.length > 2) {
    console.log('run');
    record()
        .then(() => {
            console.log('Success');
        })
        .catch((err) => {
            console.log('Error', err);
        });
}
