import * as path from 'path';
import { FFmpegProcess, FFmpegProcessResult } from './services/FFmpegProcess';
import { StreamRecorder } from './services/StreamRecorder';
import { RecorderState } from './models';

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

async function recordWithRecorder() {
    return new Promise<void>((resolve, reject) => {
        const recorder = new StreamRecorder('https://test-streams.mux.dev/pts_shift/master.m3u8', {
            workingDirectory: path.join(__dirname, '/out'),
        });
        recorder.onComplete.once(() => {
            console.log('Completed');
            resolve();
        });
        recorder.onStateChange.on((data) => {
            console.log('State change', data);
            if (data.newState === RecorderState.PROCESS_EXITED_ABNORMALLY) {
                recorder.stop();
            }
        });
        recorder.onSegmentFileAdd.on((file) => {
            console.log('File added: ', file);
        });
        recorder.start();
    });
}

if (process.argv.length > 2) {
    console.log('run');
    recordWithRecorder()
        .then(() => {
            console.log('Success');
        })
        .catch((err) => {
            console.log('Error', err);
        });
}
