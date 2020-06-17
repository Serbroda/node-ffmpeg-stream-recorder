import { FFmpegProcess, FFmpegProcessResult } from '../index';
import { join, basename, dirname } from 'path';
import * as fs from 'fs';
import { sleep } from '../helpers/ThreadingHelper';
import { FFmpegProcessOptions } from '../services/FFmpegProcess';
import { deleteFolderRecursive } from '../helpers/FileHelper';
import { createUnique } from '../helpers/UniqueHelper';

import { getLogger } from '@log4js-node/log4js-api';

const logger = getLogger('ffmpeg-stream-recorder');
logger.level = 'debug';

jest.setTimeout(20 * 1000);

// ffmpeg -y -i https://test-streams.mux.dev/pts_shift/master.m3u8 -c:v copy -c:a copy -f segment -segment_list out.ffcat seg_%03d.ts
const testUrl = 'https://test-streams.mux.dev/pts_shift/master.m3u8';
const testingDirectory = __dirname + '/out/ffmpegprocess';

beforeAll(() => {
    const folders = [basename(dirname(testingDirectory)), testingDirectory];
    folders.forEach((f) => {
        if (!fs.existsSync(f)) {
            fs.mkdirSync(f);
        }
    });
});

afterAll(() => {
    sleep(1000);
    deleteFolderRecursive(testingDirectory, true);
});

const ensureDirExists = (dir: string): string => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
    return dir;
};

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
    cwd: testingDirectory,
};

it('should create FFmpegProcess', () => {
    expect(() => {
        new FFmpegProcess();
    }).not.toThrow(Error);
});
it('should exit normally and download segment files', (done: jest.DoneCallback) => {
    const dir = ensureDirExists(join(testingDirectory, createUnique()));
    const callback = (result: FFmpegProcessResult) => {
        try {
            expect(result.exitCode).toBe(0);
            expect(fs.readdirSync(dir).filter((f) => f.endsWith('.ts')).length).toBeGreaterThan(0);
            done();
        } catch (error) {
            done(error);
        }
    };

    new FFmpegProcess().start(args, {
        ...options,
        cwd: dir,
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
        cwd: ensureDirExists(join(testingDirectory, createUnique())),
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
        cwd: ensureDirExists(join(testingDirectory, createUnique())),
        onExit: callback,
    });
    sleep(2000);
    process.kill();
});

it('should not start twice', (done: jest.DoneCallback) => {
    const opt = {
        ...options,
        workDirectory: ensureDirExists(join(testingDirectory, createUnique())),
    };
    const process = new FFmpegProcess();
    process.start(args, opt);
    sleep(200);
    expect(() => {
        process.start(args, opt);
    }).toThrow(Error);
    process.kill();
    process.waitForProcessKilled();
    done();
});
