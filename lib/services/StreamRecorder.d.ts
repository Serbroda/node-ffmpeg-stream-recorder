import { RecorderState } from '../models/RecorderState';
import { IGenericEvent } from '../helpers/GenericEvent';
import { IStreamRecorder, SessionInfo, StateChange, StreamRecorderOptions } from '../models/IStreamRecorder';
import { ToJson } from '../helpers/TypeHelper';
export declare class StreamRecorder implements IStreamRecorder, ToJson<IStreamRecorder> {
    private readonly _id;
    private readonly _onStartEvent;
    private readonly _onStopEvent;
    private readonly _onCompleteEvent;
    private readonly _onStateChangeEvent;
    private readonly _onSegmentFileAddEvent;
    private _name;
    private _url;
    private _options;
    private _process;
    private _sessionInfo;
    private _fileWatcher;
    constructor(recorder: IStreamRecorder);
    constructor(url: string, options?: Partial<StreamRecorderOptions>);
    get onStart(): IGenericEvent<SessionInfo>;
    get onStop(): IGenericEvent<void>;
    get onComplete(): IGenericEvent<void>;
    get onStateChange(): IGenericEvent<StateChange>;
    get onSegmentFileAdd(): IGenericEvent<string>;
    /**
     * Unique recorder id e.g 19112814560452.
     */
    get id(): string;
    get name(): string;
    set name(val: string);
    /**
     * The options for the recorder.
     */
    get options(): StreamRecorderOptions;
    /**
     * Informations about the current session.
     */
    get sessionInfo(): SessionInfo;
    /**
     * Gets the current recorder state.
     */
    get state(): RecorderState;
    /**
     * Sets the URL to record.
     * @param url Stream URL
     */
    set url(url: string);
    /**
     * The URL to be recorded.
     */
    get url(): string;
    /**
     * Sets the output file.
     * @param outFile Outfile
     */
    set outFile(outFile: string | undefined);
    /**
     * Gets the defined output file.
     */
    get outFile(): string | undefined;
    private setState;
    /**
     * Gets true if recorder is currently busy or false if not.
     * @returns Busy true/false
     */
    isBusy(): boolean;
    /**
     * Starts the recording.
     */
    start(): void;
    pause(): void;
    /**
     * Stops the recording and creats the output file.
     */
    stop(finish?: boolean): void;
    /**
     * Discards the currently recordered files
     */
    discard(): void;
    /**
     * Creates the target output file from currently recorded segments
     * @param outfile Target media file
     */
    finish(outfile?: string): void;
    private record;
    private createOutputFile;
    private cleanWorkingDirectory;
    toJson(): IStreamRecorder;
}
