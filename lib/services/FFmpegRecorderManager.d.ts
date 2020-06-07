import { FFmpegRecorder, FFmpegRecorderStandardOptions, FFmpegRecorderState } from './FFmpegRecorder';
import { IRecorderItem, RecorderItemOrId } from '../models/RecorderItem';
interface RecorderWithReuquest {
    request: IRecorderItem;
    recorder: FFmpegRecorder;
}
export interface FFmpegRecorderManagerOptions extends FFmpegRecorderStandardOptions {
    autoRemoveAfterStopped?: boolean;
}
export declare const defaultFFmpegRecorderManagerOptions: FFmpegRecorderManagerOptions;
export declare class FFmpegRecorderManager {
    private recorders;
    private _options;
    constructor(options?: FFmpegRecorderManagerOptions);
    create(request: IRecorderItem, onStateChange?: (item: IRecorderItem, newState: FFmpegRecorderState) => void): IRecorderItem;
    start(recorder: RecorderItemOrId): void;
    stop(recorder: RecorderItemOrId): void;
    pause(recorder: RecorderItemOrId): void;
    remove(recorder: RecorderItemOrId): void;
    getRecorderWithReuquest(recorder: RecorderItemOrId): RecorderWithReuquest | undefined;
    getRecorder(recorder: RecorderItemOrId): FFmpegRecorder | undefined;
    getReuqestItem(recorder: RecorderItemOrId): IRecorderItem | undefined;
    getRequestItems(): IRecorderItem[];
    getRecorderItems(): FFmpegRecorder[];
    getRecorderWithRequestItems(): RecorderWithReuquest[];
    existsRecorder(recorder: RecorderItemOrId): boolean;
}
export {};
