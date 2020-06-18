import { Recorder, RecorderStandardOptions } from './Recorder';
import { RecorderState, IRecorderItem, RecorderItemOrId } from '../models';
interface RecorderWithReuquest {
    request: IRecorderItem;
    recorder: Recorder;
}
export interface MultiRecorderManagerOptions extends RecorderStandardOptions {
    autoRemoveWhenFinished?: boolean;
    maxConcurrentlyCreatingOutfiles?: number;
    onRecorderListChange?: (recorders?: IRecorderItem[]) => void;
    onRecorderAdded?: (recorder: IRecorderItem) => void;
    onRecorderRemoved?: (recorder: IRecorderItem) => void;
    onRecorderStateChanged?: (recorder: IRecorderItem, newState?: RecorderState) => void;
}
export declare const defaultMultiRecorderManagerOptions: MultiRecorderManagerOptions;
export declare class MultiRecorderManager {
    private recorders;
    private _options;
    private _semaphore?;
    constructor(options?: MultiRecorderManagerOptions);
    get isUseSemaphore(): boolean;
    get options(): MultiRecorderManagerOptions;
    create(request: IRecorderItem, onStateChange?: (item: IRecorderItem, newState: RecorderState) => void): IRecorderItem;
    start(recorder: RecorderItemOrId): void;
    stop(recorder: RecorderItemOrId): void;
    pause(recorder: RecorderItemOrId): void;
    remove(recorder: RecorderItemOrId, force?: boolean): void;
    hasBusyRecorders(): boolean;
    getRecorderWithReuquest(recorder: RecorderItemOrId): RecorderWithReuquest | undefined;
    getRecorder(recorder: RecorderItemOrId): Recorder | undefined;
    getReuqestItem(recorder: RecorderItemOrId): IRecorderItem | undefined;
    getRequestItems(): IRecorderItem[];
    getRecorderItems(): Recorder[];
    getRecorderWithRequestItems(): RecorderWithReuquest[];
    existsRecorder(recorder: RecorderItemOrId): boolean;
}
export {};
