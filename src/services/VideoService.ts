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

//export type TimeStamp = `${number}${number}:${number}${number}:${number}${number}`;
const timeStamp = /^[0-9]{2}:[0-9]{2}:[0-9]{2}.[0-9]{0,3}$/;

export class VideoService {
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

    /*
    https://superuser.com/questions/138331/using-ffmpeg-to-cut-up-video
    The following would clip the first 30 seconds, and then clip everything that is 10 seconds after that:
        ffmpeg -ss 00:00:30.0 -i input.wmv -c copy -t 00:00:10.0 output.wmv
        ffmpeg -ss 30 -i input.wmv -c copy -t 10 output.wmv
     */
    async cutVideo(
        input: string,
        start: number | string,
        duration: number | string,
        outfile: string,
        options: CutOptions = { override: false }
    ) {
        return new Promise<string>((resolve, reject) => {
            if (!fs.existsSync(input)) {
                throw new Error(`File '${input}' not found`);
            }
            if (fs.existsSync(outfile)) {
                if (outfile) {
                    fs.rmSync(outfile);
                } else {
                    throw new Error(`Output file '${input}' already outfile`);
                }
            }

            const startParam = typeof start === 'number' ? `${start}` : `${start}.0`;
            const durationParam = typeof duration === 'number' ? `${duration}` : `${duration}.0`;

            const prc = new FFmpegProcess();
            prc.onExit.once((result) => {
                resolve(outfile);
            });
            prc.start(['-ss', startParam, '-i', input, '-c', 'copy', '-t', durationParam, outfile]);
        });
    }
}
