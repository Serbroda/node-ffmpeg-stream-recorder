import { FFmprobeOptions } from './FFprobeProcess';
export interface ThumbnailOptions {
    outfile: string;
    resolution: string;
    offsetSeconds: number;
}
export declare class Video {
    getDuration(file: string, options?: Partial<FFmprobeOptions>): Promise<number>;
    createThumbnail(filename: string, options?: Partial<ThumbnailOptions>): Promise<string>;
}
