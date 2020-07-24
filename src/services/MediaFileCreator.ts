import * as path from 'path';
import * as fs from 'fs';
import { findFiles, mergeFiles } from '../helpers/FileHelper';
import { FFmpegProcess } from './FFmpegProcess';
import { createUnique } from '../helpers/UniqueHelper';
import { ofType } from '../helpers/TypeHelper';

export interface MediaFileCreationOptions {
    creator: WithRootCreator | WithSegmentFilesCreator | WithSegmentListsCreator;
    cwd: string;
}

export class WithRootCreator {
    constructor(public root: string) {}
}

export class WithSegmentFilesCreator {
    constructor(public segmentFiles: string[]) {}
}

export class WithSegmentListsCreator {
    constructor(public segmentLists: string[]) {}
}

export class MediaFileCreator {
    constructor(private cwd: string = __dirname) {}

    public async create(outfile: string, options?: Partial<MediaFileCreationOptions>): Promise<string | undefined> {
        const opt: MediaFileCreationOptions = {
            ...{ cwd: this.cwd, creator: new WithRootCreator(this.cwd) },
            ...options,
        };
        const { creator } = opt;

        if (ofType<WithRootCreator>(creator, WithRootCreator)) {
            const segmentListFiles = this.findSegmentLists(creator.root);
            if (segmentListFiles.length > 0) {
                return this.create(outfile, {
                    ...opt,
                    ...{ creator: new WithSegmentListsCreator(segmentListFiles) },
                });
            }
            const segmentFiles = this.findSegmentFiles(creator.root);
            if (segmentFiles.length > 0) {
                return this.create(outfile, {
                    ...opt,
                    ...{ creator: new WithSegmentFilesCreator(segmentFiles) },
                });
            }
            return undefined;
        } else if (ofType<WithSegmentFilesCreator>(creator, WithSegmentFilesCreator)) {
            if (creator.segmentFiles.length === 1) {
                return this.convert(creator.segmentFiles[0], outfile);
            }
            const segmentList = this.createSegmentList(creator.segmentFiles);
            return this.create(outfile, {
                ...opt,
                ...{ creator: new WithSegmentListsCreator([segmentList]) },
            });
        } else if (ofType<WithSegmentListsCreator>(creator, WithSegmentListsCreator)) {
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
        const unique = createUnique();
        const filename = `all_${unique}.ts`;
        await new FFmpegProcess().startAsync(['-f', 'concat', '-i', mergedSegmentListFile, '-c', 'copy', filename], {
            cwd: this.cwd,
        });
        return filename;
    }

    public async convert(inputFile: string, outfile: string): Promise<string> {
        console.log('Convert', {
            tsfile: inputFile,
            outfile,
        });
        await new FFmpegProcess().startAsync(['-i', inputFile, '-acodec', 'copy', '-vcodec', 'copy', outfile], {
            cwd: this.cwd,
        });
        return outfile;
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
