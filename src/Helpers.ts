import { join } from 'path';
import * as fs from 'fs';

export const sleep = (ms: number): Promise<void> => {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
};

export const createDateTimeString = (date?: Date) => {
    const dt = date ? date : new Date();
    return `${dt.getFullYear()}${dt.getMonth()}${dt.getDate()}${dt.getHours()}${dt.getMinutes()}${dt.getSeconds()}${dt.getMilliseconds()}`;
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
