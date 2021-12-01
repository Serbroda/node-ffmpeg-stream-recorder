import { FFmprobeOptions, FFprobeProcess } from './FFprobeProcess';
import * as path from 'path';
import * as fs from 'fs';
import { FFmpegProcess } from './FFmpegProcess';

export interface ThumbnailOptions {
    outfile: string;
    resolution: string;
    offsetSeconds: number;
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

export class Video {
    async getMetadata(file: string, options?: Partial<FFmprobeOptions>): Promise<VideoMetadata> {
        const fileStats = fs.statSync(file);
        const ext = path.extname(file);
        const filename = path.basename(file, ext);
        const duration = await this.getDuration(file, options);
        return {
            name: filename,
            path: file,
            duration,
            size: fileStats.size,
            created: fileStats.mtime,
            type: ext,
        };
    }

    async getDuration(file: string, options?: Partial<FFmprobeOptions>): Promise<number> {
        const result = await new FFprobeProcess().exec(
            ['-i', file, '-show_entries', 'format=duration', '-v', 'quiet', '-of', 'csv=p=0'],
            options
        );
        return +result;
    }

    async createThumbnail(filename: string, options?: Partial<ThumbnailOptions>): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            const extension = path.extname(filename);
            const name = path.basename(filename, extension);
            const opt: ThumbnailOptions = {
                ...{
                    outfile: path.join(path.dirname(filename), `${name}.jpg`),
                    resolution: '640x360',
                    offsetSeconds: 2,
                    override: false,
                },
                ...options,
            };

            if (fs.existsSync(opt.outfile)) {
                if (opt.override) {
                    fs.rmSync(opt.outfile);
                } else {
                    throw new Error(`Thumbnail already exists`);
                }
            }

            const prc = new FFmpegProcess();
            prc.onExit.once((result) => {
                resolve(opt.outfile);
            });
            prc.start([
                '-itsoffset',
                `-${opt.offsetSeconds}`,
                '-i',
                filename,
                '-vcodec',
                'mjpeg',
                '-vframes',
                '1',
                '-an',
                '-f',
                'rawvideo',
                '-s',
                opt.resolution,
                opt.outfile,
            ]);
        });
    }
}
