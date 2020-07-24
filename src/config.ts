export interface FFmpegStreamRecorderConfiguration {
    executable: string;
}

export let configuration: FFmpegStreamRecorderConfiguration = {
    executable: 'ffmpeg',
};

export function configure(config: Partial<FFmpegStreamRecorderConfiguration>) {
    configuration = { ...configuration, ...config };
}
