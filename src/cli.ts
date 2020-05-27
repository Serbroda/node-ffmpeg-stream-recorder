import { FFmpegProcess } from './FFmpegProcess';
import { sleep } from './Helpers';
import { FFmpegRecorder } from './FFmpegRecorder';

let recorder: FFmpegRecorder;
console.log('Args', process.argv);

process.on('exit', (code) => {
    console.log(`Whoa! Exit code ${code}, cleaning up...`);
    recorder?.stop();
    recorder?.finish('output.mp4');
});

async function record() {
    console.log('Starting process...');
    recorder = new FFmpegRecorder(
        'C:\\Users\\danny\\Downloads\\ffmpeg-20200522-38490cb-win64-static\\bin\\ffmpeg.exe'
    );
    recorder.record(process.argv[2], {
        workingDirectory: 'C:\\tmp\\chat\\t',
    });

    console.log('Sleep...');
    await sleep(10000);
    console.log('Finishing...');
    recorder.stop();
    recorder.finish('test.mp4');
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
