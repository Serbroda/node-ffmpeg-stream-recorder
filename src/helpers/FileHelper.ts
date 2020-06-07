import { join } from 'path';
import * as fs from 'fs';

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
