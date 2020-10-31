import { FFmpegProcess } from '../index';

jest.setTimeout(20 * 1000);

it('should create FFmpegProcess', () => {
    expect(() => {
        new FFmpegProcess();
    }).not.toThrow(Error);
});
