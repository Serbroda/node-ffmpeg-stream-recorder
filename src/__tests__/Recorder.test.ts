import { Recorder } from '../services/Recorder';

jest.setTimeout(20 * 1000);

it('should create Recorder', () => {
    expect(() => {
        new Recorder();
    }).not.toThrow(Error);
});
