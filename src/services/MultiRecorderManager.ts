import { StreamRecorder, StreamRecorderStandardOptions, StreamRecorderOptions, SessionInfo } from './StreamRecorder';
import { RecorderState, Dictionary } from '../models';
import { Semaphore } from './Semaphore';
import { getLogger } from '@log4js-node/log4js-api';
import { IGenericEvent, GenericEvent } from '../helpers/GenericEvent';

const logger = getLogger('ffmpeg-stream-recorder');

export type StreamRecorderOrId = StreamRecorder | string;

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
export class MultiRecorderManager {
    private recorders: Dictionary<StreamRecorder | undefined> = {};

    private _options: MultiRecorderManagerOptions;
    private _semaphore?: Semaphore;

    private _onRecorderStateChangeEvent: GenericEvent<RecorderStateChange> = new GenericEvent<RecorderStateChange>();

    constructor(options?: Partial<MultiRecorderManagerOptions>) {
        this._options = { ...{ autoRemoveWhenFinished: false, maxConcurrentlyCreatingOutfiles: -1 }, ...options };
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

    public create(
        request: {
            url: string;
            outfile: string;
            cwd?: string;
        },
        onStateChange?: (info: RecorderStateChange) => void
    ): StreamRecorder {
        const recorderOptions: StreamRecorderOptions = this._options as StreamRecorderOptions;
        const autocreateOutputInSemaphore = this.isUseSemaphore && this._options.createOnExit;

        if (autocreateOutputInSemaphore) {
            recorderOptions.createOnExit = false;
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
                const rec = this.getRecorder(data.sessionInfo.recorderId);
                if (rec) {
                    this._onRecorderStateChangeEvent.trigger({
                        recorder: rec,
                        newState: data.newState,
                        oldState: data.oldState,
                        sessionInfo: data.sessionInfo,
                    });

                    if (data.newState == RecorderState.PROCESS_EXITED_ABNORMALLY && autocreateOutputInSemaphore) {
                        logger.debug(
                            'Automatically stopping recorder via manager',
                            this.recorders[data.sessionInfo.recorderId]
                        );
                        this.stop(rec);
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

        this.recorders[rec.id] = rec;
        if (this._options.onRecorderAdded) {
            this._options.onRecorderAdded(rec);
        }
        if (this._options.onRecorderListChange) {
            this._options.onRecorderListChange(this.getRecorders());
        }
        return rec;
    }

    public start(recorder: StreamRecorderOrId) {
        let rec = this.getRecorder(recorder);
        if (rec) {
            logger.debug('Starting recorder via manager', rec);
            rec.start();
        }
    }

    public stop(recorder: StreamRecorderOrId) {
        let rec = this.getRecorder(recorder);
        if (rec) {
            if (this._semaphore) {
                logger.debug('Stopping recorder via manager adding to semaphore', rec);
                this._semaphore.take((next) => {
                    rec!.stop(undefined, () => {
                        next();
                    });
                });
                //this.updateRecorderState(rec, RecorderState.WAITING_IN_QUEUE);
            } else {
                logger.debug('Stopping recorder via manager', rec);
                rec.stop();
            }
        }
    }

    public pause(recorder: StreamRecorderOrId) {
        let rec = this.getRecorder(recorder);
        if (rec) {
            logger.debug('Pausing recorder via manager', rec);
            rec.pause();
        }
    }

    public remove(recorder: StreamRecorderOrId, force?: boolean) {
        let rec = this.getRecorder(recorder);
        if (rec) {
            if (!rec.isBusy() || force) {
                logger.debug('Removing recorder from manager', rec);

                this.recorders[rec.id] = undefined;

                if (this._options.onRecorderRemoved) {
                    this._options.onRecorderRemoved(rec);
                }
                if (this._options.onRecorderListChange) {
                    this._options.onRecorderListChange(this.getRecorders());
                }
            } else {
                throw Error('Recorder seems to be busy. You should stop recording before removing it.');
            }
        }
    }

    private updateRecorderState(
        recorder: StreamRecorder,
        newState: RecorderState,
        oldState?: RecorderState,
        sessionInfo?: SessionInfo
    ) {
        this._onRecorderStateChangeEvent.trigger({
            recorder: recorder,
            newState,
            oldState,
            sessionInfo,
        });
    }

    public hasBusyRecorders(): boolean {
        return this.getRecorders().filter((r) => r.isBusy()).length > 0;
    }

    public getRecorder(recorder: StreamRecorderOrId): StreamRecorder | undefined {
        if (typeof recorder === 'string') {
            return this.recorders[recorder];
        } else {
            return this.recorders[recorder.id];
        }
    }

    public getRecorders(): StreamRecorder[] {
        let items: StreamRecorder[] = [];
        for (let key in this.recorders) {
            let rec = this.recorders[key];
            if (rec) {
                items.push(rec);
            }
        }
        return items;
    }

    public existsRecorder(recorder: StreamRecorderOrId): boolean {
        return this.getRecorder(recorder) !== undefined;
    }
}
