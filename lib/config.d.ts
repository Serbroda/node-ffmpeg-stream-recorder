export interface FFmpegStreamRecorderConfiguration {
    executable: string;
}
export declare let configuration: FFmpegStreamRecorderConfiguration;
export declare function configure(config: Partial<FFmpegStreamRecorderConfiguration>): void;
