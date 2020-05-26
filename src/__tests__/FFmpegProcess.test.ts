import { FFmpegProcess } from '../index';

test('It should download segments', () => {
    const process = new FFmpegProcess();
    process.start(
        [
            '-y',
            '-i',
            'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
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
        __dirname + '/out'
    );
});
