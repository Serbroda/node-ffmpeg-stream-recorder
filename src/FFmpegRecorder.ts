import { FFmpegProcess } from './FFmpegProcess';
import { findFiles, createUnique, mergeFiles } from './Helpers';
import { join, dirname } from 'path';
import * as fs from 'fs';

export enum FFmpegRecorderState {
    INITIAL = 'INITIAL',
    RECORDING = 'RECORDING',
    PAUSED = 'PAUSED',
    STOPPING = 'STOPPING',
    CREATINGOUTFILE = 'CREATINGOUTFILE',
    CLEANING = 'CLEANING',
    FINISH = 'FINISH',
}

export interface FFmpegSessionInfo {
    unique: string;
    state: FFmpegRecorderState;
    startCounter: number;
}

export interface FFmpegRecorderOptions {
    ffmpegExecutable?: string;
    outfile?: string;
    workingDirectory?: string;
    generateSubdirectoryForSession?: boolean;
    printMessages?: boolean;
    cleanSegmentFiles?: boolean;
    ensureDirectoryExists?: boolean;
    onStart?: () => void;
    onComplete?: () => void;
    onStateChange?: (
        newState: FFmpegRecorderState,
        oldState?: FFmpegRecorderState,
        sessionInfo?: FFmpegSessionInfo
    ) => void;
}

const defaultOptions: FFmpegRecorderOptions = {
    workingDirectory: __dirname,
    generateSubdirectoryForSession: true,
    printMessages: false,
    cleanSegmentFiles: true,
    ensureDirectoryExists: true,
};

export class FFmpegRecorder {
    private readonly _id: string;
    private _url: string;
    private _options: FFmpegRecorderOptions;

    private _process: FFmpegProcess | undefined;
    private _currentWorkingDirectory: string | undefined;

    private _sessionInfo: FFmpegSessionInfo;

    constructor(url: string, options?: FFmpegRecorderOptions) {
        this._id = createUnique();
        this._url = url;
        this._options = { ...defaultOptions, ...options };
        this._sessionInfo = {
            unique: this._id,
            state: FFmpegRecorderState.INITIAL,
            startCounter: 0,
        };
    }

    public get id(): string {
        return this._id;
    }

    public get sessionInfo(): FFmpegSessionInfo {
        return this._sessionInfo;
    }

    public get state(): FFmpegRecorderState {
        return this._sessionInfo.state;
    }

    public get url(): string {
        return this._url;
    }

    public set url(url: string) {
        this._url = url;
    }

    public get options(): FFmpegRecorderOptions {
        return this._options;
    }

    private setState(state: FFmpegRecorderState) {
        if (state == FFmpegRecorderState.RECORDING && this._options.onStart) {
            this._options.onStart();
        }
        if (state == FFmpegRecorderState.FINISH && this._options.onComplete) {
            this._options.onComplete();
        }
        if (this._options.onStateChange) {
            this._options.onStateChange(
                this._sessionInfo.state,
                state,
                this._sessionInfo
            );
        }
        this.sessionInfo.state = state;
    }

    public isBusy(): boolean {
        if (this._process && this._process.isRunning()) {
            return true;
        }
        return (
            this._sessionInfo.state !== FFmpegRecorderState.INITIAL &&
            this._sessionInfo.state !== FFmpegRecorderState.FINISH &&
            this._sessionInfo.state !== FFmpegRecorderState.PAUSED
        );
    }

    public sessionSegmentLists(): string[] {
        if (!this._currentWorkingDirectory) {
            return [];
        }
        return findFiles(
            this._currentWorkingDirectory,
            new RegExp(`seglist_${this._sessionInfo.unique}_\\d*\\.txt`)
        );
    }

    public sessionSegmentFiles(): string[] {
        if (!this._currentWorkingDirectory) {
            return [];
        }
        return findFiles(
            this._currentWorkingDirectory,
            new RegExp(`seg_${this._sessionInfo.unique}_\\d*_\\d*\\.ts`)
        );
    }

    public start() {
        if (this._process && this._process.isRunning()) {
            console.warn('Process is busy.');
            return;
        }
        if (
            this._options.ensureDirectoryExists &&
            this._options.workingDirectory &&
            !fs.existsSync(this._options.workingDirectory)
        ) {
            fs.mkdirSync(this._options.workingDirectory);
        }
        if (this._sessionInfo.state != FFmpegRecorderState.PAUSED) {
            this._sessionInfo.unique = createUnique();
            const workDir = this._options.workingDirectory
                ? this._options.workingDirectory
                : __dirname;
            if (!fs.existsSync(workDir)) {
                throw new Error(
                    `Working directory '${workDir}' does not exist!`
                );
            }
            this._currentWorkingDirectory = workDir;
            if (this._options.generateSubdirectoryForSession) {
                this._currentWorkingDirectory = join(
                    workDir,
                    this._sessionInfo.unique
                );
                if (!fs.existsSync(this._currentWorkingDirectory)) {
                    fs.mkdirSync(this._currentWorkingDirectory);
                }
            }
        }
        this._sessionInfo.startCounter = this._sessionInfo.startCounter + 1;
        this.recordForSession();
    }

    public pause() {
        this.setState(FFmpegRecorderState.PAUSED);
        this.killProcess();
    }

    public stop(outfile?: string) {
        this.setState(FFmpegRecorderState.STOPPING);
        this.killProcess();

        let out = this._options.outfile;
        if (outfile) {
            out = outfile;
        }
        if (out) {
            const dir = dirname(out);
            if (this._options.ensureDirectoryExists && !fs.existsSync(dir)) {
                fs.mkdirSync(dir);
            }
            this.createOutputFile(out, () => {
                this.cleanWorkingDirectory();
                this.setState(FFmpegRecorderState.FINISH);
            });
        } else {
            console.warn('No output file specified');
            this.setState(FFmpegRecorderState.FINISH);
        }
    }

    private killProcess() {
        if (this._process) {
            this._process.kill();
        }
    }

    private recordForSession() {
        this._process = new FFmpegProcess(this._options.ffmpegExecutable);
        this._process.start(
            [
                '-y',
                '-i',
                this._url,
                '-c:v',
                'copy',
                '-c:a',
                'copy',
                '-f',
                'segment',
                '-segment_list',
                `seglist_${
                    this._sessionInfo.unique
                }_${this._sessionInfo.startCounter
                    .toString()
                    .padStart(2, '0')}.txt`,
                '-segment_list_entry_prefix',
                'file ',
                `seg_${
                    this._sessionInfo.unique
                }_${this._sessionInfo.startCounter
                    .toString()
                    .padStart(2, '0')}_%05d.ts`,
            ],
            {
                workDirectory: this._currentWorkingDirectory,
                printMessages: this._options.printMessages,
                onExit: (code: number) => {
                    if (
                        this._sessionInfo.state == FFmpegRecorderState.RECORDING
                    ) {
                        console.warn('Process exited abnormally');
                        this.setState(FFmpegRecorderState.PAUSED);
                    }
                },
            }
        );
        this.setState(FFmpegRecorderState.RECORDING);
    }

    private createOutputFile(outfile: string, onProcessFinish: () => void) {
        if (
            (this._process && this._process.isRunning()) ||
            !this._currentWorkingDirectory
        ) {
            return;
        }
        this.setState(FFmpegRecorderState.CREATINGOUTFILE);
        let args: string[];
        const tsFiles = this.sessionSegmentFiles();
        const mergedSegmentList = this.mergeSegmentLists();
        if (!mergedSegmentList) {
            console.warn('Segment list not found');
            return;
        }
        if (tsFiles.length == 0) {
            console.error('Could not find segment files');
            return;
        } else if (tsFiles.length == 1) {
            args = ['-i', tsFiles[0], '-map', '0', '-c', 'copy', outfile];
        } else {
            args = [
                '-f',
                'concat',
                '-i',
                mergedSegmentList,
                '-c',
                'copy',
                outfile,
            ];
        }
        this._process?.start(args, {
            workDirectory: this._currentWorkingDirectory,
            printMessages: this._options.printMessages,
            onExit: (code: number) => {
                onProcessFinish();
            },
        });
    }

    private mergeSegmentLists(): string | undefined {
        const segLists = this.sessionSegmentLists();
        console.log('seglists', segLists);
        if (!segLists || segLists.length == 0) {
            return undefined;
        } else if (segLists.length == 1) {
            return segLists[0];
        } else {
            if (!this._currentWorkingDirectory) {
                return undefined;
            }
            const mergedOutFile = join(
                this._currentWorkingDirectory,
                `seglist_${this._sessionInfo.unique}_merged.txt`
            );
            const status = mergeFiles(segLists, mergedOutFile);
            return mergedOutFile;
        }
    }

    private cleanWorkingDirectory() {
        if (this._currentWorkingDirectory && this._options.cleanSegmentFiles) {
            this.setState(FFmpegRecorderState.CLEANING);
            this.sessionSegmentFiles().forEach((f) => {
                fs.unlinkSync(f);
            });
            this.sessionSegmentLists().forEach((f) => {
                fs.unlinkSync(f);
            });
            const mergedSegmentList = join(
                this._currentWorkingDirectory,
                `seglist_${this._sessionInfo.unique}_merged.txt`
            );
            if (fs.existsSync(mergedSegmentList)) {
                fs.unlinkSync(mergedSegmentList);
            }
            if (this._options.generateSubdirectoryForSession) {
                fs.rmdirSync(this._currentWorkingDirectory);
            }
        }
    }
}
