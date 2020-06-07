import { join } from 'path';
import * as fs from 'fs';

export const sleep = (ms: number): Promise<void> => {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
};

export const createUnique = (date?: Date) => {
    const dt = date ? date : new Date();
    const year = dt.getFullYear().toString().substr(-2);
    const month = padStartNumber(dt.getMonth(), 2, '0');
    const day = padStartNumber(dt.getDate(), 2, '0');
    const hours = padStartNumber(dt.getHours(), 2, '0');
    const minutes = padStartNumber(dt.getMinutes(), 2, '0');
    const seconds = padStartNumber(dt.getSeconds(), 2, '0');
    const milliseconds = padStartNumber(dt.getMilliseconds(), 3, '0');
    const random = generateRandomNumber({ min: 1, max: 9 });
    return `${year}${month}${day}${hours}${minutes}${seconds}${milliseconds}${random}`;
};

export const padStartNumber = (
    value: number,
    length: number,
    char?: string
): string => {
    return value.toString().padStart(length, char);
};

export const generateRandomNumber = (opt?: { min?: number; max?: number }) => {
    const min = opt?.min ? opt?.min : 0;
    const max = opt?.max ? opt?.max : 0;
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const findFiles = (rootDirectory: string, pattern?: RegExp) => {
    let files: string[] = fs.readdirSync(rootDirectory);
    if (pattern) {
        return files
            .filter(
                (f) =>
                    !fs.statSync(join(rootDirectory, f)).isDirectory() &&
                    pattern.test(f)
            )
            .map((f) => join(rootDirectory, f));
    } else {
        return files
            .filter((f) => !fs.statSync(join(rootDirectory, f)).isDirectory())
            .map((f) => join(rootDirectory, f));
    }
};

export const mergeFiles = (files: string[], outfile: string) => {
    files.forEach((f) => {
        fs.appendFileSync(outfile, fs.readFileSync(f));
    });
};
