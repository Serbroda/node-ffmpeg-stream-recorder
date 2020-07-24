import { StreamRecorder, StreamRecorderStandardOptions, SessionInfo } from './Recorder';
import { RecorderState, IRecorderItem, RecorderItemOrId } from '../models';
import { IGenericEvent } from '../helpers/GenericEvent';
interface RecorderWithReuquest {
    request: IRecorderItem;
    recorder: StreamRecorder;
}
export interface RecorderStateChange {
    recorder: IRecorderItem;
    newState?: RecorderState;
    oldState?: RecorderState;
    sessionInfo?: SessionInfo;
}
export interface MultiRecorderManagerOptions extends StreamRecorderStandardOptions {
    autoRemoveWhenFinished?: boolean;
    maxConcurrentlyCreatingOutfiles?: number;
    onRecorderStateChanged?: (info: RecorderStateChange) => void;
    onRecorderAdded?: (recorder: IRecorderItem) => void;
    onRecorderRemoved?: (recorder: IRecorderItem) => void;
    onRecorderListChange?: (recorders?: IRecorderItem[]) => void;
}
export declare const defaultMultiRecorderManagerOptions: MultiRecorderManagerOptions;
export declare class MultiRecorderManager {
    private recorders;
    private _options;
    private _semaphore?;
    private _onRecorderStateChangeEvent;
    constructor(options?: MultiRecorderManagerOptions);
    get isUseSemaphore(): boolean;
    get options(): MultiRecorderManagerOptions;
    get onRecorderStateChangeEvent(): IGenericEvent<RecorderStateChange>;
    create(request: IRecorderItem, onStateChange?: (info: RecorderStateChange) => void): IRecorderItem;
    start(recorder: RecorderItemOrId): void;
    stop(recorder: RecorderItemOrId): void;
    pause(recorder: RecorderItemOrId): void;
    remove(recorder: RecorderItemOrId, force?: boolean): void;
    private updateRecorderState;
    hasBusyRecorders(): boolean;
    getRecorderWithReuquest(recorder: RecorderItemOrId): RecorderWithReuquest | undefined;
    getRecorder(recorder: RecorderItemOrId): StreamRecorder | undefined;
    getReuqestItem(recorder: RecorderItemOrId): IRecorderItem | undefined;
    getRequestItems(): IRecorderItem[];
    getRecorderItems(): StreamRecorder[];
    getRecorderWithRequestItems(): RecorderWithReuquest[];
    existsRecorder(recorder: RecorderItemOrId): boolean;
}
export {};
