import { findFiles, mergeFiles } from '../helpers/FileHelper';
import { FFmpegProcess } from './FFmpegProcess';
import { createUnique } from '../helpers/UniqueHelper';
import { join } from 'path';

export interface IMediaFileCreation {
    outfile: string;
}

export class MediaFileCreationWithRoot implements IMediaFileCreation {
    constructor(public outfile: string, public root: string) {}
}

export class MediaFileCreationWithSegmentFiles implements IMediaFileCreation {
    constructor(public outfile: string, public segmentFiles: string[]) {}
}

export class MediaFileCreationWithSegmentListFiles implements IMediaFileCreation {
    constructor(public outfile: string, public segmentListFiles: string[]) {}
}

export class MediaFileCreator {
    constructor(private root: string) {}

    public async create(outfile: string, segments?: string[]): Promise<string | undefined> {
        const files: string[] = segments ? segments : this.getSegmentFiles();
        console.log('Create', files);

        if (files.length === 0) {
            return undefined;
        } else if (files.length === 1) {
            return this.convert(files[0], outfile);
        } else {
            const concat = await this.concat();
            return this.convert(concat, outfile);
        }
    }

    public async concat(segmentLists?: string[]): Promise<string> {
        const files = segmentLists ? segmentLists : this.getSegmentListFiles();
        const fullSegmentListFile = files.length > 1 ? this.mergeSegmentFiles(files) : files[0];
        const unique = createUnique();
        const filename = `all_${unique}.ts`;
        console.log('Concat', {
            files,
            fullSegmentListFile,
        });
        await new FFmpegProcess().startAsync(['-f', 'concat', '-i', fullSegmentListFile, '-c', 'copy', filename], {
            cwd: this.root,
        });
        return filename;
    }

    public async convert(tsfile: string, outfile: string): Promise<string> {
        console.log('Convert', {
            tsfile,
            outfile,
        });
        await new FFmpegProcess().startAsync(['-i', tsfile, '-acodec', 'copy', '-vcodec', 'copy', outfile], {
            cwd: this.root,
        });
        return outfile;
    }

    public getSegmentFiles(directory?: string, pattern?: RegExp): string[] {
        const dir = directory ? directory : this.root;
        const pttrn = pattern ? pattern : new RegExp(`seg_\\d*_\\d*_\\d*\\.ts`);
        return findFiles(dir, pttrn);
    }

    public getSegmentListFiles(directory?: string, pattern?: RegExp): string[] {
        const dir = directory ? directory : this.root;
        const pttrn = pattern ? pattern : new RegExp(`seglist_\\d*_\\d*\\.txt`);
        return findFiles(dir, pttrn);
    }

    private mergeSegmentFiles(files: string[]): string {
        const unique = createUnique();
        const mergedOutFile = join(this.root, `seglist_${unique}_merged.txt`);
        mergeFiles(files, mergedOutFile);
        return mergedOutFile;
    }
}
