import * as fs from 'fs';
import { basename, dirname, join } from 'path';
import { Recorder } from '../services/Recorder';
import { RecorderState } from '../models';
import { deleteFolderRecursive } from '../helpers/FileHelper';

const testUrl = 'https://test-streams.mux.dev/pts_shift/master.m3u8';
const testingDirectory = __dirname + '/out/recorder';

jest.setTimeout(20 * 1000);

beforeAll(() => {
    const folders = [testingDirectory];
    folders.forEach((f) => {
        if (!fs.existsSync(f)) {
            fs.mkdirSync(f, { recursive: true });
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
    const recorder = new Recorder('123');
    const callback = (data: { newState: RecorderState; previousState: RecorderState }) => {
        try {
            expect(data.newState).toBeTruthy();
            recorder.stop();
            done();
        } catch (error) {
            done(error);
        }
    };

    recorder.onStateChangeEvent.on(callback);
    recorder.start(testUrl, join(testingDirectory, '/out.ts'));
});
