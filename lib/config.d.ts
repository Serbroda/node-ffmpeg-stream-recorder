export interface FFmpegStreamRecorderConfiguration {
    executable: string;
    fetcher: (url: RequestInfo | any, init?: RequestInit | any) => Promise<Response | any>;
}
export declare let configuration: FFmpegStreamRecorderConfiguration;
export declare function configure(config: Partial<FFmpegStreamRecorderConfiguration>): void;
