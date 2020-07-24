export interface IMediaFileCreation {
    outfile: string;
}
export declare class MediaFileCreationWithRoot implements IMediaFileCreation {
    outfile: string;
    root: string;
    constructor(outfile: string, root: string);
}
export declare class MediaFileCreationWithSegmentFiles implements IMediaFileCreation {
    outfile: string;
    segmentFiles: string[];
    constructor(outfile: string, segmentFiles: string[]);
}
export declare class MediaFileCreationWithSegmentListFiles implements IMediaFileCreation {
    outfile: string;
    segmentListFiles: string[];
    constructor(outfile: string, segmentListFiles: string[]);
}
export declare class MediaFileCreator {
    private root;
    constructor(root: string);
    create(outfile: string, segments?: string[]): Promise<string | undefined>;
    concat(segmentLists?: string[]): Promise<string>;
    convert(tsfile: string, outfile: string): Promise<string>;
    getSegmentFiles(directory?: string, pattern?: RegExp): string[];
    getSegmentListFiles(directory?: string, pattern?: RegExp): string[];
    private mergeSegmentFiles;
}
