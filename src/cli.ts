import * as path from 'path';
import { Recorder } from './services/Recorder';
import { sleepAsync } from './helpers/ThreadingHelper';

console.log('Args', process.argv);

if (process.argv.length > 2) {
    console.log('run');
    const url =
        'https://edge86.stream.highwebmedia.com/live-hls/amlst:naughtyelle-sd-247f6f749ab28d8f4c01cebd997b152b990c8cdeb2d965eb2320f06def691577_trns_h264/playlist.m3u8';
    const outfile = path.join(process.cwd(), 'out', `output.mp4`);
    const recorder = new Recorder();
    recorder.start(url, outfile, { timestamp: true }).then((res) => console.log('Download finished', res));

    sleepAsync(10000).then(() => {
        recorder.stop();
    });
}
