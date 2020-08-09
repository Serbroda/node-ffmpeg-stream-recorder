import * as path from 'path';
import * as fs from 'fs';
import { sleep } from './ThreadingHelper';

export const findFiles = (rootDirectory: string, pattern?: string | RegExp) => {
    let files: string[] = fs.readdirSync(rootDirectory);
    if (pattern) {
        return files
            .filter(
                (f) => !fs.statSync(path.join(rootDirectory, f)).isDirectory() && filenameMatchesPattern(f, pattern)
            )
            .map((f) => path.join(rootDirectory, f));
    } else {
        return files
            .filter((f) => !fs.statSync(path.join(rootDirectory, f)).isDirectory())
            .map((f) => path.join(rootDirectory, f));
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

export const deleteFolderRecursive = (p: string, filesOnly?: boolean) => {
    if (fs.existsSync(p)) {
        fs.readdirSync(p).forEach((file, index) => {
            const curPath = path.join(p, file);
            if (fs.lstatSync(curPath).isDirectory()) {
                // recurse
                deleteFolderRecursive(curPath);
            } else {
                // delete file
                tryDeleteFileTimes(curPath);
            }
        });
        if (filesOnly !== undefined && !filesOnly) {
            try {
                fs.rmdirSync(p);
            } catch (err) {
                console.error(`Failed to delete directory '${p}'`);
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
            console.error(`Failed to delete file '${path}'`);
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

export const rm = (...files: string[]) => {
    for (let file of files) {
        if (fs.existsSync(file)) {
            fs.unlinkSync(file);
        }
    }
};

export const fileParts = (
    filepath: string
): {
    path: string;
    dir: string;
    file: string;
    name: string;
    ext: string;
} => {
    const ext = path.extname(filepath);
    return {
        path: filepath,
        dir: path.dirname(filepath),
        file: path.basename(filepath),
        name: path.basename(filepath, ext),
        ext: ext,
    };
};
