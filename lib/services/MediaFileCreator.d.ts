export interface MediaFileCreationOptions {
    creator: CreatorWithRoot | CreatorWithSegmentFiles | CreatorWithSegmentLists;
    cwd: string;
}
export declare class CreatorWithRoot {
    root: string;
    constructor(root: string);
}
export declare class CreatorWithSegmentFiles {
    segmentFiles: string[];
    constructor(segmentFiles: string[]);
}
export declare class CreatorWithSegmentLists {
    segmentLists: string[];
    constructor(segmentLists: string[]);
}
export declare class MediaFileCreator {
    private cwd;
    constructor(cwd?: string);
    create(outfile: string, options?: Partial<MediaFileCreationOptions>): Promise<string | undefined>;
    concat(mergedSegmentListFile: string): Promise<string>;
    convert(inputFile: string, outfile: string): Promise<string>;
    findSegmentFiles(directory: string, pattern?: RegExp): string[];
    findSegmentLists(directory: string, pattern?: RegExp): string[];
    private mergeSegmentFiles;
    createSegmentList(segmentFiles: string[]): string;
}
