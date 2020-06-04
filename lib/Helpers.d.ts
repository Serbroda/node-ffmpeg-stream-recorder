export declare const sleep: (ms: number) => Promise<void>;
export declare const createUnique: (date?: Date | undefined) => string;
export declare const padStartNumber: (value: number, length: number, char?: string | undefined) => string;
export declare const generateRandomNumber: (opt?: {
    min?: number | undefined;
    max?: number | undefined;
} | undefined) => number;
export declare const findFiles: (rootDirectory: string, pattern?: RegExp | undefined) => string[];
export declare const mergeFiles: (files: string[], outfile: string) => void;
