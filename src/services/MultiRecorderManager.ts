import { StreamRecorder, StreamRecorderStandardOptions, StreamRecorderOptions, SessionInfo } from './StreamRecorder';
import { RecorderState, Dictionary, IRecorderItem, RecorderItemOrId } from '../models';
import { Semaphore } from './Semaphore';
import { getLogger } from '@log4js-node/log4js-api';
import { IGenericEvent, GenericEvent } from '../helpers/GenericEvent';

const logger = getLogger('ffmpeg-stream-recorder');

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

export const defaultMultiRecorderManagerOptions: MultiRecorderManagerOptions = {
    autoRemoveWhenFinished: false,
    maxConcurrentlyCreatingOutfiles: -1,
};

export class MultiRecorderManager {
    private recorders: Dictionary<RecorderWithReuquest | undefined> = {};

    private _options: MultiRecorderManagerOptions;
    private _semaphore?: Semaphore;

    private _onRecorderStateChangeEvent: GenericEvent<RecorderStateChange> = new GenericEvent<RecorderStateChange>();

    constructor(options?: MultiRecorderManagerOptions) {
        this._options = { ...defaultMultiRecorderManagerOptions, ...options };
        if (this.isUseSemaphore) {
            this._semaphore = new Semaphore(this._options.maxConcurrentlyCreatingOutfiles);
        }
    }

    public get isUseSemaphore(): boolean {
        return (
            this._options.maxConcurrentlyCreatingOutfiles !== undefined &&
            this._options.maxConcurrentlyCreatingOutfiles > 0
        );
    }

    public get options(): MultiRecorderManagerOptions {
        return this._options;
    }

    public get onRecorderStateChangeEvent(): IGenericEvent<RecorderStateChange> {
        return this._onRecorderStateChangeEvent.expose();
    }

    public create(request: IRecorderItem, onStateChange?: (info: RecorderStateChange) => void): IRecorderItem {
        const recorderOptions: StreamRecorderOptions = this._options as StreamRecorderOptions;
        const autocreateOutputInSemaphore =
            this.isUseSemaphore && this._options.automaticallyCreateOutfileIfExitedAbnormally;

        if (autocreateOutputInSemaphore) {
            recorderOptions.automaticallyCreateOutfileIfExitedAbnormally = false;
        }

        if (onStateChange) {
            this._onRecorderStateChangeEvent.on(onStateChange);
        }

        recorderOptions.onStateChange = (data: {
            newState: RecorderState;
            oldState?: RecorderState;
            sessionInfo?: SessionInfo;
        }) => {
            if (data.sessionInfo) {
                const recorderWithRequest = this.getRecorderWithReuquest(data.sessionInfo.recorderId);
                if (recorderWithRequest) {
                    recorderWithRequest.request.state = data.newState;
                    this.recorders[recorderWithRequest.recorder.id]!.request = recorderWithRequest.request;

                    this._onRecorderStateChangeEvent.trigger({
                        recorder: recorderWithRequest.request,
                        newState: data.newState,
                        oldState: data.oldState,
                        sessionInfo: data.sessionInfo,
                    });

                    if (data.newState == RecorderState.PROCESS_EXITED_ABNORMALLY && autocreateOutputInSemaphore) {
                        logger.debug(
                            'Automatically stopping recorder via manager',
                            this.recorders[data.sessionInfo.recorderId]
                        );
                        this.stop(request);
                    } else if (data.newState == RecorderState.COMPLETED && this._options.autoRemoveWhenFinished) {
                        logger.debug(
                            'Automatically removing recorder from manager',
                            this.recorders[data.sessionInfo.recorderId]
                        );
                        setTimeout(() => {
                            this.remove(data.sessionInfo!.recorderId, true);
                        });
                    }
                }
            }
        };

        let rec = new StreamRecorder(request.url, {
            ...recorderOptions,
            ...{
                outfile: request.outfile,
            },
        });
        logger.debug('Created recorder', rec);

        request.id = rec.id;
        request.state = rec.state;
        this.recorders[rec.id] = {
            request,
            recorder: rec,
        };
        if (this._options.onRecorderAdded) {
            this._options.onRecorderAdded(request);
        }
        if (this._options.onRecorderListChange) {
            this._options.onRecorderListChange(this.getRequestItems());
        }
        return request;
    }

    public start(recorder: RecorderItemOrId) {
        let rec = this.getRecorder(recorder);
        if (rec) {
            logger.debug('Starting recorder via manager', rec);
            rec.start();
        }
    }

    public stop(recorder: RecorderItemOrId) {
        let rec = this.getRecorderWithReuquest(recorder);
        if (rec) {
            if (this._semaphore) {
                logger.debug('Stopping recorder via manager adding to semaphore', rec);
                this._semaphore.take((next) => {
                    rec?.recorder!.stop(undefined, () => {
                        next();
                    });
                });
                this.updateRecorderState(rec, RecorderState.WAITING_IN_QUEUE);
            } else {
                logger.debug('Stopping recorder via manager', rec);
                rec?.recorder.stop();
            }
        }
    }

    public pause(recorder: RecorderItemOrId) {
        let rec = this.getRecorder(recorder);
        if (rec) {
            logger.debug('Pausing recorder via manager', rec);
            rec.pause();
        }
    }

    public remove(recorder: RecorderItemOrId, force?: boolean) {
        let rec = this.getRecorderWithReuquest(recorder);
        if (rec && rec.request.id) {
            if (!rec.recorder.isBusy() || force) {
                logger.debug('Removing recorder from manager', rec);
                const request = this.recorders[rec.request.id]!.request;

                this.recorders[rec.request.id] = undefined;

                if (this._options.onRecorderRemoved) {
                    this._options.onRecorderRemoved(request);
                }
                if (this._options.onRecorderListChange) {
                    this._options.onRecorderListChange(this.getRequestItems());
                }
            } else {
                throw Error('Recorder seems to be busy. You should stop recording before removing it.');
            }
        }
    }

    private updateRecorderState(
        recorder: RecorderWithReuquest,
        newState: RecorderState,
        oldState?: RecorderState,
        sessionInfo?: SessionInfo
    ) {
        this.recorders[recorder.recorder.id]!.request.state = newState;
        this._onRecorderStateChangeEvent.trigger({
            recorder: recorder.request,
            newState,
            oldState,
            sessionInfo,
        });
    }

    public hasBusyRecorders(): boolean {
        return this.getRecorderItems().filter((r) => r.isBusy()).length > 0;
    }

    public getRecorderWithReuquest(recorder: RecorderItemOrId): RecorderWithReuquest | undefined {
        let rec;
        if (typeof recorder === 'string' || recorder instanceof String) {
            rec = this.recorders[recorder as string];
        } else if (recorder.id) {
            rec = this.recorders[recorder.id];
        }
        return rec;
    }

    public getRecorder(recorder: RecorderItemOrId): StreamRecorder | undefined {
        return this.getRecorderWithReuquest(recorder)?.recorder;
    }

    public getReuqestItem(recorder: RecorderItemOrId): IRecorderItem | undefined {
        return this.getRecorderWithReuquest(recorder)?.request;
    }

    public getRequestItems(): IRecorderItem[] {
        return this.getRecorderWithRequestItems().map((i) => i.request);
    }

    public getRecorderItems(): StreamRecorder[] {
        return this.getRecorderWithRequestItems().map((i) => i.recorder);
    }

    public getRecorderWithRequestItems(): RecorderWithReuquest[] {
        let items: RecorderWithReuquest[] = [];
        for (let key in this.recorders) {
            let rec = this.getRecorderWithReuquest(key);
            if (rec) {
                items.push(rec);
            }
        }
        return items;
    }

    public existsRecorder(recorder: RecorderItemOrId): boolean {
        return this.getRecorderWithReuquest(recorder) !== undefined;
    }
}
