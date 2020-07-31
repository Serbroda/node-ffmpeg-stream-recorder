import * as path from 'path';
import * as fs from 'fs';
import { findFiles, mergeFiles } from '../helpers/FileHelper';
import { FFmpegProcess } from './FFmpegProcess';
import { createUnique } from '../helpers/UniqueHelper';
import { ofType } from '../helpers/TypeHelper';
import { rejects } from 'assert';

export interface MediaFileCreationOptions {
    creator: CreatorWithRoot | CreatorWithSegmentFiles | CreatorWithSegmentLists;
    cwd: string;
}

export class CreatorWithRoot {
    constructor(public root: string) {}
}

export class CreatorWithSegmentFiles {
    constructor(public segmentFiles: string[]) {}
}

export class CreatorWithSegmentLists {
    constructor(public segmentLists: string[]) {}
}

export class MediaFileCreator {
    constructor(private cwd: string = __dirname) {}

    public async create(outfile: string, options?: Partial<MediaFileCreationOptions>): Promise<string | undefined> {
        const opt: MediaFileCreationOptions = {
            ...{ cwd: this.cwd, creator: new CreatorWithRoot(this.cwd) },
            ...options,
        };
        const { creator } = opt;

        if (ofType<CreatorWithRoot>(creator, CreatorWithRoot)) {
            const segmentListFiles = this.findSegmentLists(creator.root);
            if (segmentListFiles.length > 0) {
                return this.create(outfile, {
                    ...opt,
                    ...{ creator: new CreatorWithSegmentLists(segmentListFiles) },
                });
            }
            const segmentFiles = this.findSegmentFiles(creator.root);
            if (segmentFiles.length > 0) {
                return this.create(outfile, {
                    ...opt,
                    ...{ creator: new CreatorWithSegmentFiles(segmentFiles) },
                });
            }
            return undefined;
        } else if (ofType<CreatorWithSegmentFiles>(creator, CreatorWithSegmentFiles)) {
            if (creator.segmentFiles.length === 1) {
                return this.convert(creator.segmentFiles[0], outfile);
            }
            const segmentList = this.createSegmentList(creator.segmentFiles);
            return this.create(outfile, {
                ...opt,
                ...{ creator: new CreatorWithSegmentLists([segmentList]) },
            });
        } else if (ofType<CreatorWithSegmentLists>(creator, CreatorWithSegmentLists)) {
            let mergedSegmentListFile;
            if (creator.segmentLists.length === 1) {
                mergedSegmentListFile = creator.segmentLists[0];
            } else if (creator.segmentLists.length > 1) {
                mergedSegmentListFile = this.mergeSegmentFiles(this.cwd, creator.segmentLists);
            } else {
                return undefined;
            }
            const concatenatedFile = await this.concat(mergedSegmentListFile);
            return this.convert(concatenatedFile, outfile);
        }
    }

    public async concat(mergedSegmentListFile: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            const unique = createUnique();
            const filename = `all_${unique}.ts`;
            new FFmpegProcess()
                .startAsync(['-f', 'concat', '-i', mergedSegmentListFile, '-c', 'copy', filename], {
                    cwd: this.cwd,
                })
                .then(() => setTimeout(() => resolve(filename), 500))
                .catch((err) => reject(err));
        });
    }

    public async convert(inputFile: string, outfile: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            new FFmpegProcess()
                .startAsync(['-i', inputFile, '-acodec', 'copy', '-vcodec', 'copy', outfile], {
                    cwd: this.cwd,
                })
                .then(() => setTimeout(() => resolve(outfile), 500))
                .catch((err) => reject(err));
        });
    }

    public findSegmentFiles(directory: string, pattern?: RegExp): string[] {
        const pttrn = pattern ? pattern : new RegExp(`seg_\\d*_\\d*_\\d*\\.ts`);
        return findFiles(directory, pttrn);
    }

    public findSegmentLists(directory: string, pattern?: RegExp): string[] {
        const pttrn = pattern ? pattern : new RegExp(`seglist_\\d*_\\d*\\.txt`);
        return findFiles(directory, pttrn);
    }

    private mergeSegmentFiles(directory: string, files: string[]): string {
        const unique = createUnique();
        const mergedOutFile = path.join(directory, `seglist_${unique}_merged.txt`);
        mergeFiles(files, mergedOutFile);
        return mergedOutFile;
    }

    public createSegmentList(segmentFiles: string[]): string {
        const unique = createUnique();
        const segmentListFile = `seglist_${unique}.txt`;
        const writer = fs.createWriteStream(path.join(this.cwd, segmentListFile), {
            flags: 'a',
        });
        segmentFiles.forEach((f) => writer.write(`file ${path.basename(f)}\n`));
        writer.close();
        return segmentListFile;
    }
}
