import {
    FFmpegRecorder,
    FFmpegRecorderStandardOptions,
    FFmpegRecorderOptions,
    FFmpegSessionInfo,
} from './FFmpegRecorder';
import { IRecorderItem, RecorderItemOrId } from '../models/RecorderItem';
import { FFmpegRecorderState } from '../models/FFmpegRecorderState';

interface Dictionary<T> {
    [key: string]: T;
}

interface RecorderWithReuquest {
    request: IRecorderItem;
    recorder: FFmpegRecorder;
}

export interface FFmpegRecorderManagerOptions
    extends FFmpegRecorderStandardOptions {
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
        onStateChange?: (
            item: IRecorderItem,
            newState: FFmpegRecorderState
        ) => void
    ): IRecorderItem {
        const recorderOptions: FFmpegRecorderOptions = this
            ._options as FFmpegRecorderOptions;

        recorderOptions.onStateChange = (
            newState: FFmpegRecorderState,
            oldState?: FFmpegRecorderState,
            sessionInfo?: FFmpegSessionInfo
        ) => {
            if (sessionInfo) {
                const rec = this.getRecorderWithReuquest(sessionInfo.id);
                if (rec) {
                    rec.request.state = newState;
                    if (onStateChange) {
                        onStateChange(rec.request, newState);
                    }
                }
            }
        };

        let rec = new FFmpegRecorder(request.url, {
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

    public getRecorder(recorder: RecorderItemOrId): FFmpegRecorder | undefined {
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

    public getRecorderItems(): FFmpegRecorder[] {
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
