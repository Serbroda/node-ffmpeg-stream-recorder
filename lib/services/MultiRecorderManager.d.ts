import { StreamRecorder } from './StreamRecorder';
import { RecorderState } from '../models';
import { IGenericEvent } from '../helpers/GenericEvent';
import { SessionInfo, StreamRecorderStandardOptions } from '../models/IStreamRecorder';
import { StreamRecorderOrId } from '../models/StreamRecorderOrId';
export interface RecorderStateChange {
    recorder: StreamRecorder;
    newState?: RecorderState;
    oldState?: RecorderState;
    sessionInfo?: SessionInfo;
}
export interface MultiRecorderManagerOptions extends Partial<StreamRecorderStandardOptions> {
    autoRemoveWhenFinished?: boolean;
    maxConcurrentlyCreatingOutfiles?: number;
    onRecorderStateChanged?: (info: RecorderStateChange) => void;
    onRecorderAdded?: (recorder: StreamRecorder) => void;
    onRecorderRemoved?: (recorder: StreamRecorder) => void;
    onRecorderListChange?: (recorders?: StreamRecorder[]) => void;
}
export declare class MultiRecorderManager {
    private recorders;
    private _options;
    private _semaphore?;
    private _onRecorderStateChangeEvent;
    constructor(options?: Partial<MultiRecorderManagerOptions>);
    get isUseSemaphore(): boolean;
    get options(): MultiRecorderManagerOptions;
    get onRecorderStateChangeEvent(): IGenericEvent<RecorderStateChange>;
    create(request: {
        url: string;
        outfile: string;
        cwd?: string;
    }, onStateChange?: (info: RecorderStateChange) => void): StreamRecorder;
    start(recorder: StreamRecorderOrId): void;
    stop(recorder: StreamRecorderOrId): void;
    pause(recorder: StreamRecorderOrId): void;
    remove(recorder: StreamRecorderOrId, force?: boolean): void;
    private updateRecorderState;
    hasBusyRecorders(): boolean;
    getRecorder(recorder: StreamRecorderOrId): StreamRecorder | undefined;
    getRecorders(): StreamRecorder[];
    existsRecorder(recorder: StreamRecorderOrId): boolean;
}
