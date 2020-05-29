import { FFmpegProcess } from '../index';
import { join } from 'path';
import * as fs from 'fs';
import { waitForDebugger } from 'inspector';
import { sleep } from '../Helpers';

jest.setTimeout(20000);

const testUrl = 'https://test-streams.mux.dev/pts_shift/master.m3u8';
const testingDirectory = __dirname + '/out';

beforeAll(() => {
    if (!fs.existsSync(testingDirectory)) {
        fs.mkdirSync(testingDirectory);
    }
});

beforeEach(() => {
    fs.readdirSync(testingDirectory).forEach((f) => {
        fs.unlinkSync(f);
    });
});

it('should download segments', async (p) => {
    const onExitCallback = (code: number, signal?: NodeJS.Signals) => {
        p();
    };
    const process = new FFmpegProcess();
    process.start(
        [
            '-y',
            '-i',
            testUrl,
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
            workDirectory: testingDirectory,
            onExit: onExitCallback,
        }
    );
    await sleep(5000);
    process.kill();
    await sleep(200);
    expect(onExitCallback).toBeCalledTimes(1);
    expect(fs.readdirSync(testingDirectory).length).toBeGreaterThan(0);
});
