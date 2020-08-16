import { IGenericEvent } from '../helpers/GenericEvent';
import { RecorderState, RecordResult, RecordOptions } from '../models';
export declare class Recorder {
    private readonly _id;
    private readonly _onStartEvent;
    private readonly _onStopEvent;
    private readonly _onStateChangeEvent;
    private _recorderProcess;
    private _startedAt;
    private _state;
    constructor(id?: string);
    get id(): string;
    get onStart(): IGenericEvent<void>;
    get onStop(): IGenericEvent<RecordResult>;
    get onStateChangeEvent(): IGenericEvent<{
        newState: RecorderState;
        previousState: RecorderState;
    }>;
    get startedAt(): Date | undefined;
    get state(): RecorderState;
    get isRunning(): boolean;
    start(hlsSource: string, outfile: string, options?: Partial<RecordOptions>): Promise<RecordResult>;
    private getMapIndexFromOption;
    stop(): Promise<void>;
    convert(input: string, output: string): Promise<void>;
    private doFinish;
    private setState;
}
