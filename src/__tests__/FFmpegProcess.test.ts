import { FFmpegProcess, FFmpegProcessResult } from '../index';
import { join } from 'path';
import * as fs from 'fs';
import { sleep } from '../helpers/ThreadingHelper';
import { FFmpegProcessOptions } from '../services/FFmpegProcess';

jest.setTimeout(20 * 1000);

// ffmpeg -y -i https://test-streams.mux.dev/pts_shift/master.m3u8 -c:v copy -c:a copy -f segment -segment_list out.ffcat seg_%03d.ts
const testUrl = 'https://test-streams.mux.dev/pts_shift/master.m3u8';
const testingDirectory = __dirname + '/out';

const cleanTestDirectory = () => {
    sleep(2000);
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

const args = [
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
];
const options: FFmpegProcessOptions = {
    workDirectory: testingDirectory,
    printMessages: false,
};

it('should exit normally and download segment files', (done: jest.DoneCallback) => {
    const callback = (result: FFmpegProcessResult) => {
        try {
            expect(result.exitCode).toBe(0);
            expect(
                fs
                    .readdirSync(testingDirectory)
                    .filter((f) => f.endsWith('.ts')).length
            ).toBeGreaterThan(0);
            done();
        } catch (error) {
            done(error);
        }
    };

    new FFmpegProcess().start(args, {
        ...options,
        onExit: callback,
    });
});

it('should kill planned', (done: jest.DoneCallback) => {
    const callback = (result: FFmpegProcessResult) => {
        try {
            expect(result.plannedKill).toBe(true);
            done();
        } catch (error) {
            done(error);
        }
    };

    const process = new FFmpegProcess();
    process.start(args, {
        ...options,
        onExit: callback,
    });
    sleep(2000);
    process.kill();
});

it('should wait for killed', (done: jest.DoneCallback) => {
    const process = new FFmpegProcess();
    const callback = (result: FFmpegProcessResult) => {
        try {
            expect(process.waitForProcessKilled()).toBe(true);
            done();
        } catch (error) {
            done(error);
        }
    };

    process.start(args, {
        ...options,
        onExit: callback,
    });
    sleep(2000);
    process.kill();
});
