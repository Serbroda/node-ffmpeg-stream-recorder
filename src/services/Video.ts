import { FFmprobeOptions, FFprobeProcess } from './FFprobeProcess';
import * as path from 'path';
import { FFmpegProcess } from './FFmpegProcess';

export interface ThumbnailOptions {
    outfile: string;
    resolution: string;
    offsetSeconds: number;
}

export class Video {
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
                },
                ...options,
            };

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
