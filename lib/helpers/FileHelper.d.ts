export declare const findFiles: (rootDirectory: string, pattern?: string | RegExp | undefined) => string[];
export declare const filenameMatchesPattern: (filename: string, pattern: string | RegExp) => boolean;
export declare const mergeFiles: (files: string[], outfile: string) => void;
export declare const deleteFolderRecursive: (path: string, filesOnly?: boolean | undefined) => void;
export declare const mkdir: (...directories: string[]) => void;
