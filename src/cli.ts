import { sleepAsync } from './helpers/ThreadingHelper';
import { Recorder } from './services/Recorder';
import { createUnique } from './helpers/UniqueHelper';
import { join, resolve } from 'path';
import { FFmpegProcess, FFmpegProcessResult } from './services/FFmpegProcess';

let recorder: Recorder;
console.log('Args', process.argv);

async function record() {
    /*console.log('Starting process...');
    recorder = new Recorder(process.argv[2], {
        workingDirectory: join(__dirname, '/out'),
        cleanSegmentFiles: false,
    });
    recorder.start();

    for (let index = 0; index < 2; index++) {
        await sleepAsync(5000);
        recorder.pause();
        console.log('Paused');
        await sleepAsync(2000);
        console.log('Resuming');
        recorder.start();
    }
    console.log('Stopping...');
    recorder.stop('C:\\tmp\\chat\\outputtest_' + createUnique() + '.mp4');
    console.log('DONE!!');

    await sleepAsync(2000);
    recorder.start();

    await sleepAsync(10000);
    recorder.stop('C:\\tmp\\chat\\outputtest_' + createUnique() + '.mp4');
    console.log('DONE!!');*/

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
                cwd: join(__dirname, '/out'),
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
