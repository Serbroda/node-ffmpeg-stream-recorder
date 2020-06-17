import * as fs from 'fs';
import { join, basename, dirname } from 'path';
import { Recorder, RecorderStandardOptions } from '../services/Recorder';
import { RecorderState } from '../models';
import { createUnique } from '../helpers/UniqueHelper';
import { deleteFolderRecursive } from '../helpers/FileHelper';
import { sleep } from '../helpers/ThreadingHelper';

const testUrl = 'https://test-streams.mux.dev/pts_shift/master.m3u8';
const testingDirectory = __dirname + '/out/recorder';

jest.setTimeout(20 * 1000);

beforeAll(() => {
    const folders = [basename(dirname(testingDirectory)), testingDirectory];
    folders.forEach((f) => {
        if (!fs.existsSync(f)) {
            fs.mkdirSync(f);
        }
    });
});

afterAll(() => {
    deleteFolderRecursive(testingDirectory, true);
});

it('should create Recorder', () => {
    expect(() => {
        new Recorder(testUrl);
    }).not.toThrow(Error);
});

it('should update state', (done: jest.DoneCallback) => {
    const callback = (newState: RecorderState) => {
        try {
            expect(newState).toBeTruthy();
            done();
        } catch (error) {
            done(error);
        }
    };

    const recorder = new Recorder(testUrl, {
        workingDirectory: testingDirectory,
        onStateChange: callback,
    });
    recorder.start();
    recorder.kill();
});

it('should should update state to PROCESS_EXITED_ABNORMALLY if not stopped manually', (done: jest.DoneCallback) => {
    const callback = (newState: RecorderState) => {
        try {
            console.log(newState);
            if (newState === RecorderState.PROCESS_EXITED_ABNORMALLY) {
                expect(newState).toBeTruthy();
                sleep(2000);
                done();
            }
        } catch (error) {
            done(error);
        }
    };

    const recorder = new Recorder(testUrl, {
        workingDirectory: testingDirectory,
        outfile: join(testingDirectory, createUnique() + '.mp4'),
        automaticallyCreateOutfileIfExitedAbnormally: false,
        onStateChange: callback,
    });
    recorder.start();
});
