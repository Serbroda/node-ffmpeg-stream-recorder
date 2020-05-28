import { FFmpegProcess } from './FFmpegProcess';
import { sleep, createUnique } from './Helpers';
import { FFmpegRecorder } from './FFmpegRecorder';

let recorder: FFmpegRecorder;
console.log('Args', process.argv);

async function record() {
    console.log('Starting process...');
    recorder = new FFmpegRecorder(process.argv[2], {
        ffmpegExecutable:
            'C:\\Users\\danny\\Downloads\\ffmpeg-20200522-38490cb-win64-static\\bin\\ffmpeg.exe',
        workingDirectory: 'C:\\tmp\\chat',
        cleanSegmentFiles: false,
    });
    recorder.start();

    for (let index = 0; index < 2; index++) {
        await sleep(5000);
        recorder.pause();
        console.log('Paused');
        await sleep(2000);
        console.log('Resuming');
        recorder.start();
    }
    console.log('Stopping...');
    recorder.stop('C:\\tmp\\chat\\outputtest_' + createUnique() + '.mp4');
    console.log('DONE!!');

    await sleep(2000);
    recorder.start();

    await sleep(10000);
    recorder.stop('C:\\tmp\\chat\\outputtest_' + createUnique() + '.mp4');
    console.log('DONE!!');
}

if (process.argv.length > 2) {
    record()
        .then(() => {
            console.log('Success');
        })
        .catch((err) => {
            console.log('Error', err);
        });
}
