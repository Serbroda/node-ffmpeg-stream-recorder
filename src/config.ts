export interface FFmpegStreamRecorderConfiguration {
    executable: string;
    fetcher: (url: RequestInfo, init?: RequestInit) => Promise<Response>;
}

export let configuration: FFmpegStreamRecorderConfiguration = {
    executable: 'ffmpeg',
    fetcher: fetch,
};

export function configure(config: Partial<FFmpegStreamRecorderConfiguration>) {
    configuration = { ...configuration, ...config };
}
