import * as fs from 'fs';
import * as path from 'path';
import { FFmpegProcess } from './FFmpegProcess';
import { createIsoDateTime, createUnique } from '../helpers/UniqueHelper';
import { GenericEvent, IGenericEvent } from '../helpers/GenericEvent';
import { rm } from '../helpers/FileHelper';
import { RecorderState, RecordResult, RecordOptions } from '../models';

export class Recorder {
    private readonly _id: string;
    private readonly _onStartEvent = new GenericEvent<void>();
    private readonly _onStopEvent = new GenericEvent<RecordResult>();
    private readonly _onStateChangeEvent = new GenericEvent<{
        newState: RecorderState;
        previousState: RecorderState;
    }>();

    private _recorderProcess: FFmpegProcess | undefined;
    private _startedAt: Date | undefined;
    private _state: RecorderState = RecorderState.INITIAL;

    constructor(id?: string) {
        this._id = id ? id : createUnique();
    }

    public get id(): string {
        return this._id;
    }

    public get onStart(): IGenericEvent<void> {
        return this._onStartEvent.expose();
    }

    public get onStop(): IGenericEvent<RecordResult> {
        return this._onStopEvent.expose();
    }

    public get onStateChangeEvent(): IGenericEvent<{
        newState: RecorderState;
        previousState: RecorderState;
    }> {
        return this._onStateChangeEvent.expose();
    }

    public get startedAt(): Date | undefined {
        return this._startedAt;
    }

    public get state(): RecorderState {
        return this._state;
    }

    public get isRunning(): boolean {
        return this._state === RecorderState.RECORDING || this._state === RecorderState.CONVERTING;
    }

    public async start(url: string, outfile: string, options?: Partial<RecordOptions>): Promise<RecordResult> {
        return new Promise<RecordResult>((resolve, reject) => {
            if (this.isRunning) {
                reject(new Error('Recorder is already running'));
            } else {
                this.setState(RecorderState.RECORDING);

                const opt: RecordOptions = { ...{ timestamp: false, args: [] }, ...options };

                let out = outfile;

                const dir = path.dirname(out);
                const ext = path.extname(out);
                let name = path.basename(out, ext);

                if (opt.timestamp) {
                    name = `${name}-${createIsoDateTime()}`;
                    out = path.join(dir, `${name}${ext}`);
                }

                const temp = path.join(dir, `${name}.ts`);

                this._startedAt = new Date();

                this._recorderProcess = new FFmpegProcess();
                this._recorderProcess.onExit.once((recordResult) => {
                    const result: RecordResult = {
                        url,
                        startedAt: this.startedAt!,
                        stoppedAt: new Date(),
                        outfile: out,
                        plannedStop: recordResult.plannedKill,
                        converted: false,
                    };

                    if (ext === '.ts' || !fs.existsSync(temp)) {
                        this.doFinish(resolve, result);
                    } else {
                        this.setState(RecorderState.CONVERTING);

                        this.convert(temp, out).then(() => {
                            rm(temp);

                            result.stoppedAt = new Date();
                            result.converted = true;

                            this.doFinish(resolve, result);
                        });
                    }
                });

                let recordArgs = ['-i', url];
                recordArgs = recordArgs.concat(opt.args);
                recordArgs = recordArgs.concat(['-c:v', 'copy', '-c:a', 'copy', temp]);

                this._onStartEvent.trigger();
                this._recorderProcess.start(recordArgs);
            }
        });
    }

    public async stop(): Promise<void> {
        return this._recorderProcess?.killAsync();
    }

    public async convert(input: string, output: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const convertProcess = new FFmpegProcess();
            convertProcess.onExit.once((convertResult) => {
                resolve();
            });
            convertProcess.start(['-i', input, '-acodec', 'copy', '-vcodec', 'copy', output]);
        });
    }

    private doFinish(resolve: (value?: RecordResult | PromiseLike<RecordResult>) => void, result: RecordResult) {
        this.setState(RecorderState.FINISHED);
        this._onStopEvent.trigger(result);
        resolve(result);
    }

    private setState(state: RecorderState) {
        const stateChangeObj = {
            newState: state,
            previousState: this._state,
        };
        this._onStateChangeEvent.trigger(stateChangeObj);
        this._state = state;
    }
}
