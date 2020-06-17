import * as fs from 'fs';
import { join, basename, dirname } from 'path';
import { Recorder, RecorderStandardOptions } from '../services/Recorder';
import { RecorderState } from '../models';
import { createUnique } from '../helpers/UniqueHelper';
import { deleteFolderRecursive } from '../helpers/FileHelper';
import { sleep } from '../helpers/ThreadingHelper';

const testUrl = 'https://test-streams.mux.dev/pts_shift/master.m3u8';
const testingDirectory = __dirname + '/out/recorder';

const cleanTestDirectory = () => {
    fs.readdirSync(testingDirectory).forEach((f) => {
        fs.unlinkSync(join(testingDirectory, f));
    });
};

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
    deleteFolderRecursive(testingDirectory);
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
        outfile: join(testingDirectory, createUnique() + '.mp4'),
        onStateChange: callback,
    });
    recorder.start();
    recorder.kill();
});
