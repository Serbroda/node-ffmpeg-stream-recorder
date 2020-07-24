import { join } from 'path';
import * as fs from 'fs';

export const findFiles = (rootDirectory: string, pattern?: string | RegExp) => {
    let files: string[] = fs.readdirSync(rootDirectory);
    if (pattern) {
        return files
            .filter((f) => !fs.statSync(join(rootDirectory, f)).isDirectory() && filenameMatchesPattern(f, pattern))
            .map((f) => join(rootDirectory, f));
    } else {
        return files
            .filter((f) => !fs.statSync(join(rootDirectory, f)).isDirectory())
            .map((f) => join(rootDirectory, f));
    }
};

export const filenameMatchesPattern = (filename: string, pattern: string | RegExp): boolean => {
    if (typeof pattern === 'string') {
        return new RegExp(pattern).test(filename);
    } else {
        return pattern.test(filename);
    }
};

export const mergeFiles = (files: string[], outfile: string) => {
    files.forEach((f) => {
        fs.appendFileSync(outfile, fs.readFileSync(f));
    });
};

export const deleteFolderRecursive = (path: string, filesOnly?: boolean) => {
    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach((file, index) => {
            const curPath = join(path, file);
            if (fs.lstatSync(curPath).isDirectory()) {
                // recurse
                deleteFolderRecursive(curPath);
            } else {
                // delete file
                fs.unlinkSync(curPath);
            }
        });
        if (filesOnly !== undefined && !filesOnly) {
            fs.rmdirSync(path);
        }
    }
};
