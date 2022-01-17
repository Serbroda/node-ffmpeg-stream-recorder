import { rm } from '../helpers/FileHelper';
import { GenericEvent, IGenericEvent } from '../helpers/GenericEvent';
import { createIsoDateTime, createUnique } from '../helpers/UniqueHelper';
import { RecorderState, RecordResult, RecordOptions, VariantResolutionOption, VariantOption } from '../models';
import { FFmpegProcess } from './FFmpegProcess';
import { HLSParser } from './HLSParser';
import * as fs from 'fs';
import { types } from 'hls-parser';
import * as path from 'path';

import MasterPlaylist = types.MasterPlaylist;

export class Recorder {
    private readonly _id: string;
    private readonly _onStartEvent = new GenericEvent<void>();
    private readonly _onStopEvent = new GenericEvent<RecordResult>();
    private readonly _onStateChangeEvent = new GenericEvent<{
        newState: RecorderState;
        previousState: RecorderState;
        result?: RecordResult;
    }>();

    private _recorderProcess: FFmpegProcess | undefined;
    private _startedAt: Date | undefined;
    private _state: RecorderState = RecorderState.INITIAL;

    private _lastOutFile: string | undefined = undefined;

    constructor(id?: string) {
        this._id = id ? id : createUnique();
    }

    public get id(): string {
        return this._id;
    }

    public get pid(): number | undefined {
        return this._recorderProcess?.pid;
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
        const prcRunning: boolean =
            this._recorderProcess !== undefined && this._recorderProcess !== null && this._recorderProcess.isRunning();
        return prcRunning && (this._state === RecorderState.RECORDING || this._state === RecorderState.CONVERTING);
    }

    public get process(): FFmpegProcess | undefined {
        return this._recorderProcess;
    }

    public get lastOutFile(): string | undefined {
        return this._lastOutFile;
    }

    public async start(hlsSource: string, outfile: string, options?: Partial<RecordOptions>): Promise<RecordResult> {
        return new Promise<RecordResult>(async (resolve, reject) => {
            if (this.isRunning) {
                reject(new Error('Recorder is already running'));
            } else {
                this.setState(RecorderState.RECORDING);

                const opt: RecordOptions = {
                    ...{ addTimestampToOutfile: false, ffmpegArgs: [] },
                    ...options,
                };

                let out = outfile;

                const dir = path.dirname(out);
                const ext = path.extname(out);
                let name = path.basename(out, ext);

                if (opt.addTimestampToOutfile) {
                    name = `${name}-${createIsoDateTime()}`;
                    out = path.join(dir, `${name}${ext}`);
                }

                const temp = path.join(options?.workDirectory || dir, `${name}.ts`);

                if (!fs.existsSync(path.dirname(temp))) {
                    fs.mkdirSync(path.dirname(temp));
                }

                this._startedAt = new Date();

                this._recorderProcess = new FFmpegProcess();
                this._recorderProcess.onExit.once((recordResult) => {
                    const result: RecordResult = {
                        url: hlsSource,
                        startedAt: this.startedAt!,
                        stoppedAt: new Date(),
                        outfile: out,
                        plannedStop: recordResult.plannedKill,
                        converted: false,
                    };

                    if (ext === '.ts') {
                        this.doFinish(resolve, result);
                    } else {
                        this.setState(RecorderState.CONVERTING);

                        this.convert(temp, out).then(() => {
                            setTimeout(() => {
                                rm(temp);
                            }, 1000);

                            result.stoppedAt = new Date();
                            result.converted = true;

                            this.doFinish(resolve, result);
                        });
                    }
                });

                let mapindex = await this.getMapIndexFromOption(hlsSource, options?.variant);

                let recordArgs = ['-i', hlsSource];
                recordArgs = recordArgs.concat(opt.ffmpegArgs);

                if (mapindex) {
                    recordArgs = recordArgs.concat(['-map', `p:${mapindex}`]);
                }

                recordArgs = recordArgs.concat(['-c:v', 'copy', '-c:a', 'copy', temp]);

                this._lastOutFile = out;

                this._onStartEvent.trigger();
                this._recorderProcess.start(recordArgs, {
                    checkExitContinuously: opt.checkExitContinuously,
                });
            }
        });
    }

    private async getMapIndexFromOption(hlsSource: string, variantOption?: VariantOption): Promise<number | undefined> {
        if (!variantOption) {
            return;
        }
        if (variantOption.mapIndex) {
            return variantOption.mapIndex;
        } else {
            const hls = await HLSParser.parseUrl(hlsSource);
            if (hls.isMasterPlaylist) {
                const variant = HLSParser.findVariant(hls as MasterPlaylist, variantOption as VariantResolutionOption);
                if (variant) {
                    return variant.index;
                }
            }
        }
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

    private doFinish(resolve: (value: RecordResult | PromiseLike<RecordResult>) => void, result: RecordResult) {
        this.setState(RecorderState.FINISHED, result);
        this._onStopEvent.trigger(result);
        resolve(result);
    }

    private setState(state: RecorderState, result?: RecordResult) {
        const stateChangeObj = {
            newState: state,
            previousState: this._state,
            result,
        };
        this._onStateChangeEvent.trigger(stateChangeObj);
        this._state = state;
    }
}
