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
export interface CutRange {
    start: TimeStamp | number;
    duration: TimeStamp | number;
}
export interface VideoMetadata {
    name: string;
    path: string;
    duration: number;
    size: number;
    created: Date;
    type: string;
}
export declare type TimeStamp = string;
export declare class VideoService {
    getMetadata(file: string, options?: Partial<FFmprobeOptions>): Promise<VideoMetadata>;
    getDuration(file: string, options?: Partial<FFmprobeOptions>): Promise<number>;
    createThumbnail(filename: string, options?: Partial<ThumbnailOptions>): Promise<string>;
    cutVideo(input: string, outfile: string, cutRange: CutRange | CutRange[], options?: CutOptions): Promise<string>;
    combineVideos(outfile: string, videos: string[]): Promise<string>;
}
