import {
    Recorder,
    RecorderStandardOptions,
    RecorderOptions,
    SessionInfo,
} from './Recorder';
import { IRecorderItem, RecorderItemOrId } from '../models/RecorderItem';
import { RecorderState } from '../models/RecorderState';

interface Dictionary<T> {
    [key: string]: T;
}

interface RecorderWithReuquest {
    request: IRecorderItem;
    recorder: Recorder;
}

export interface FFmpegRecorderManagerOptions extends RecorderStandardOptions {
    autoRemoveAfterStopped?: boolean;
}

export const defaultFFmpegRecorderManagerOptions: FFmpegRecorderManagerOptions = {
    autoRemoveAfterStopped: false,
};

export class FFmpegRecorderManager {
    private recorders: Dictionary<RecorderWithReuquest | undefined> = {};

    private _options: FFmpegRecorderManagerOptions;

    constructor(options?: FFmpegRecorderManagerOptions) {
        this._options = { ...defaultFFmpegRecorderManagerOptions, ...options };
    }

    public get options(): FFmpegRecorderManagerOptions {
        return this._options;
    }

    public create(
        request: IRecorderItem,
        onStateChange?: (item: IRecorderItem, newState: RecorderState) => void
    ): IRecorderItem {
        const recorderOptions: RecorderOptions = this
            ._options as RecorderOptions;

        recorderOptions.onStateChange = (
            newState: RecorderState,
            oldState?: RecorderState,
            sessionInfo?: SessionInfo
        ) => {
            if (sessionInfo) {
                if (this.recorders[sessionInfo.recorderId]) {
                    this.recorders[
                        sessionInfo.recorderId
                    ]!.request.state = newState;
                    if (onStateChange) {
                        onStateChange(
                            this.recorders[sessionInfo.recorderId]!.request,
                            newState
                        );
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
        request.id = rec.id;
        request.state = rec.state;
        this.recorders[rec.id] = {
            request,
            recorder: rec,
        };
        return request;
    }

    public start(recorder: RecorderItemOrId) {
        let rec = this.getRecorder(recorder);
        if (rec) {
            rec.start();
        }
    }

    public stop(recorder: RecorderItemOrId) {
        let rec = this.getRecorder(recorder);
        if (rec) {
            rec.stop();
        }
    }

    public pause(recorder: RecorderItemOrId) {
        let rec = this.getRecorder(recorder);
        if (rec) {
            rec.pause();
        }
    }

    public remove(recorder: RecorderItemOrId) {
        let rec = this.getRecorderWithReuquest(recorder);
        if (rec && rec.request.id) {
            this.recorders[rec.request.id] = undefined;
        }
    }

    public getRecorderWithReuquest(
        recorder: RecorderItemOrId
    ): RecorderWithReuquest | undefined {
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

    public getReuqestItem(
        recorder: RecorderItemOrId
    ): IRecorderItem | undefined {
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
