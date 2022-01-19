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

//export type TimeStamp = `${number}${number}:${number}${number}:${number}${number}`;
export type TimeStamp = string;
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
        outfile: string,
        cutRange: CutRange | CutRange[],
        options: CutOptions = { override: false }
    ) {
        if (Array.isArray(cutRange)) {
            return new Promise<string>(async (resolve, reject) => {
                let cutParts: string[] = [];
                try {
                    for (let i = 0; i < cutRange.length; i++) {
                        const range = cutRange[i];

                        const dir = path.dirname(outfile);
                        const ext = path.extname(outfile);
                        const name = path.basename(outfile, ext);
                        const tmpFile = path.join(dir, `${name}_${i}${ext}`);

                        const part = await this.cutVideo(input, tmpFile, range, { override: true });
                        cutParts.push(part);
                    }
                    await this.combineVideos(outfile, cutParts);
                    for (const part of cutParts) {
                        if (fs.existsSync(part)) {
                            fs.rmSync(part);
                        }
                    }
                    resolve(outfile);
                } catch (err) {
                    reject(err);
                }
            });
        } else {
            return new Promise<string>((resolve, reject) => {
                if (!fs.existsSync(input)) {
                    throw new Error(`File '${input}' not found`);
                }
                if (fs.existsSync(outfile)) {
                    if (options.override) {
                        fs.rmSync(outfile);
                    } else {
                        throw new Error(`Output file '${input}' already outfile`);
                    }
                }

                const start = typeof cutRange.start === 'number' ? `${cutRange.start}` : `${cutRange.start}.0`;
                const duration =
                    typeof cutRange.duration === 'number' ? `${cutRange.duration}` : `${cutRange.duration}.0`;

                console.log('Creating file', outfile);
                const prc = new FFmpegProcess();
                prc.onExit.once((result) => {
                    resolve(outfile);
                });
                prc.start(['-ss', start, '-i', input, '-c', 'copy', '-t', duration, outfile]);
            });
        }
    }

    /*
        https://stackoverflow.com/questions/7333232/how-to-concatenate-two-mp4-files-using-ffmpeg
        (echo file 'first file.mp4' & echo file 'second file.mp4' )>list.txt
        ffmpeg -safe 0 -f concat -i list.txt -c copy output.mp4
    */
    async combineVideos(outfile: string, videos: string[]) {
        return new Promise<string>((resolve, reject) => {
            if (videos.length < 1) {
                reject('Videos should be greater than 0');
            } else {
                const txt = `${outfile}.txt`;
                if (fs.existsSync(txt)) {
                    fs.rmSync(txt);
                }
                for (const video of videos) {
                    fs.appendFileSync(txt, `file '${video}'\n`);
                }

                const prc = new FFmpegProcess();
                prc.onExit.once((result) => {
                    setTimeout(() => {
                        if (fs.existsSync(txt)) {
                            fs.rmSync(txt);
                        }
                    }, 200);
                    resolve(outfile);
                });
                prc.start(['-safe', '0', `-f`, 'concat', '-i', txt, '-c', 'copy', outfile]);
            }
        });
    }
}
