import { FFmprobeOptions } from './FFprobeProcess';
export interface ThumbnailOptions {
    outfile: string;
    resolution: string;
    offsetSeconds: number;
    override: boolean;
}
export interface CutOptions {
    override: boolean;
}
export interface VideoMetadata {
    name: string;
    path: string;
    duration: number;
    size: number;
    created: Date;
    type: string;
}
export declare class VideoService {
    getMetadata(file: string, options?: Partial<FFmprobeOptions>): Promise<VideoMetadata>;
    getDuration(file: string, options?: Partial<FFmprobeOptions>): Promise<number>;
    createThumbnail(filename: string, options?: Partial<ThumbnailOptions>): Promise<string>;
    cutVideo(input: string, start: number | string, duration: number | string, outfile: string, options?: CutOptions): Promise<string>;
}
