import { RecorderState } from '.';
export interface SessionInfo {
    recorderId: string;
    sessionUnique: string;
    state: RecorderState;
    segmentUnique: string;
    retries: number;
    cwd?: string;
}
export interface StateChange {
    newState: RecorderState;
    oldState?: RecorderState;
    sessionInfo?: SessionInfo;
}
export interface StreamRecorderStandardOptions {
    /**
     * Working directory
     */
    workDir: string;
    /**
     * Current working directory
     */
    cwd?: string;
    /**
     * Cleans segment files after finished
     */
    clean: boolean;
    /**
     * Retry times if record stops abnormally
     */
    retry: number;
    /**
     * Creates file automatically if recorder stops
     */
    createOnExit: boolean;
}
export interface StreamRecorderOptions extends StreamRecorderStandardOptions {
    outfile?: string;
    onStateChange?: (state: StateChange) => void;
}
export interface IStreamRecorder {
    id: string;
    url: string;
    sessionInfo: SessionInfo;
    options: StreamRecorderOptions;
}
