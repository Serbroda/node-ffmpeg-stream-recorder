import { join } from 'path';
import * as fs from 'fs';

export const sleep = (ms: number): Promise<void> => {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
};

export const createUnique = (date?: Date) => {
    const dt = date ? date : new Date();
    return `${dt
        .getFullYear()
        .toString()
        .substr(
            -2
        )}${dt.getMonth()}${dt.getDate()}${dt.getHours()}${dt.getMinutes()}${dt.getSeconds()}${dt
        .getMilliseconds()
        .toString()
        .padStart(3, '0')}-${generateRandomNumber({ min: 1, max: 9 })}`;
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
