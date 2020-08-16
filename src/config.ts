export interface FFmpegStreamRecorderConfiguration {
    executable: string;
    fetcher: (url: RequestInfo | any, init?: RequestInit | any) => Promise<Response | any>;
}

export let configuration: FFmpegStreamRecorderConfiguration = {
    executable: 'ffmpeg',
    fetcher: fetch,
};

export function configure(config: Partial<FFmpegStreamRecorderConfiguration>) {
    configuration = { ...configuration, ...config };
}
