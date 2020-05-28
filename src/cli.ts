import { FFmpegProcess } from './FFmpegProcess';
import { sleep } from './Helpers';
import { FFmpegRecorder } from './FFmpegRecorder';

let recorder: FFmpegRecorder;
console.log('Args', process.argv);

async function record() {
    console.log('Starting process...');
    recorder = new FFmpegRecorder(
        process.argv[2],
        'C:\\tmp\\chat\\outputtest.mp4',
        {
            ffmpegExecutable:
                'C:\\Users\\danny\\Downloads\\ffmpeg-20200522-38490cb-win64-static\\bin\\ffmpeg.exe',
            workingDirectory: 'C:\\tmp\\chat',
        }
    );
    recorder.start();

    for (let index = 0; index < 2; index++) {
        await sleep(5000);
        recorder.pause();
        console.log('Paused');
        await sleep(1000);
        console.log('Resuming');
        recorder.start();
    }
    console.log('Stopping...');
    recorder.stop();
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
