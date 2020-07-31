import { join } from 'path';
import * as fs from 'fs';
import { time } from 'console';
import { sleepAsync, sleep } from './ThreadingHelper';

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
                tryDeleteFileTimes(path);
            }
        });
        if (filesOnly !== undefined && !filesOnly) {
            try {
                fs.rmdirSync(path);
            } catch (err) {
                console.error(`Cannot remove directory ${path}`, err);
            }
        }
    }
};

export const tryDeleteFileTimes = (path: string, retries: number = 3, times: number = 1) => {
    if (!tryDeleteFile(path)) {
        if (retries <= times) {
            sleep(1000);
            tryDeleteFileTimes(path, retries, times + 1);
        } else {
            console.error(`Failed to delete '${path}'`);
        }
    }
};

export const tryDeleteFile = (path: string): boolean => {
    if (!fs.existsSync(path)) {
        return true;
    }
    try {
        fs.unlinkSync(path);
        return true;
    } catch (err) {
        return false;
    }
};

export const mkdir = (...directories: string[]) => {
    for (let dir of directories) {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
    }
};
