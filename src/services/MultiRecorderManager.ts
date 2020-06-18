import { Recorder, RecorderStandardOptions, RecorderOptions, SessionInfo } from './Recorder';
import { RecorderState, Dictionary, IRecorderItem, RecorderItemOrId } from '../models';
import { Semaphore } from './Semaphore';
import { getLogger } from '@log4js-node/log4js-api';

const logger = getLogger('ffmpeg-stream-recorder');

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

export const defaultMultiRecorderManagerOptions: MultiRecorderManagerOptions = {
    autoRemoveWhenFinished: false,
    maxConcurrentlyCreatingOutfiles: -1,
};

export class MultiRecorderManager {
    private recorders: Dictionary<RecorderWithReuquest | undefined> = {};

    private _options: MultiRecorderManagerOptions;
    private _semaphore?: Semaphore;

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

    public create(
        request: IRecorderItem,
        onStateChange?: (item: IRecorderItem, newState: RecorderState) => void
    ): IRecorderItem {
        const recorderOptions: RecorderOptions = this._options as RecorderOptions;
        const autocreateOutputInSemaphore =
            this.isUseSemaphore && this._options.automaticallyCreateOutfileIfExitedAbnormally;

        if (autocreateOutputInSemaphore) {
            recorderOptions.automaticallyCreateOutfileIfExitedAbnormally = false;
        }

        recorderOptions.onStateChange = (
            newState: RecorderState,
            oldState?: RecorderState,
            sessionInfo?: SessionInfo
        ) => {
            if (sessionInfo) {
                if (this.recorders[sessionInfo.recorderId]) {
                    this.recorders[sessionInfo.recorderId]!.request.state = newState;
                    const request = this.recorders[sessionInfo.recorderId]!.request;
                    if (onStateChange) {
                        onStateChange(request, newState);
                    }
                    if (this._options.onRecorderStateChanged) {
                        this._options.onRecorderStateChanged(request, newState);
                    }
                    if (newState == RecorderState.PROCESS_EXITED_ABNORMALLY && autocreateOutputInSemaphore) {
                        logger.debug(
                            'Automatically stopping recorder via manager',
                            this.recorders[sessionInfo.recorderId]
                        );
                        this.stop(request);
                    } else if (newState == RecorderState.COMPLETED && this._options.autoRemoveWhenFinished) {
                        logger.debug(
                            'Automatically removing recorder from manager',
                            this.recorders[sessionInfo.recorderId]
                        );
                        setTimeout(() => {
                            this.remove(sessionInfo.recorderId, true);
                        });
                    }
                }
            }
        };

        let rec = new Recorder(request.url, {
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
        let rec = this.getRecorder(recorder);
        if (rec) {
            if (this._semaphore) {
                logger.debug('Stopping recorder via manager adding to semaphore', rec);
                this._semaphore.take(() => rec!.stop());
            } else {
                logger.debug('Stopping recorder via manager', rec);
                rec.stop();
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

    public getRecorder(recorder: RecorderItemOrId): Recorder | undefined {
        return this.getRecorderWithReuquest(recorder)?.recorder;
    }

    public getReuqestItem(recorder: RecorderItemOrId): IRecorderItem | undefined {
        return this.getRecorderWithReuquest(recorder)?.request;
    }

    public getRequestItems(): IRecorderItem[] {
        return this.getRecorderWithRequestItems().map((i) => i.request);
    }

    public getRecorderItems(): Recorder[] {
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
