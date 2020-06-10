import { FFmpegProcess } from '../index';
import { join } from 'path';
import * as fs from 'fs';
import { sleep } from '../helpers/ThreadingHelper';

jest.setTimeout(120000);

const testUrl = 'https://test-streams.mux.dev/pts_shift/master.m3u8';
const testingDirectory = __dirname + '/out';

const cleanTestDirectory = () => {
    fs.readdirSync(testingDirectory).forEach((f) => {
        fs.unlinkSync(join(testingDirectory, f));
    });
};

beforeAll(() => {
    if (!fs.existsSync(testingDirectory)) {
        fs.mkdirSync(testingDirectory);
    }
});

beforeEach(() => cleanTestDirectory());
afterAll(() => cleanTestDirectory());

it('should download segments', async (p) => {
    const onExitCallback = (
        code: number,
        planned?: boolean,
        signal?: NodeJS.Signals
    ) => {
        expect(fs.readdirSync(testingDirectory).length).toBeGreaterThan(0);
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
});
