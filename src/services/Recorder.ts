import { FFmpegProcess } from './FFmpegProcess';
import {
    findFiles,
    mergeFiles,
    deleteFolderRecursive,
} from '../helpers/FileHelper';
import { join, dirname } from 'path';
import * as fs from 'fs';
import { RecorderState } from '../models/RecorderState';
import { createUnique } from '../helpers/UniqueHelper';
import { Delayed } from '../helpers/Delayed';

export interface SessionInfo {
    recorderId: string;
    sessionUnique: string;
    state: RecorderState;
    startCounter: number;
    retries: number;
}

export interface RecorderStandardOptions {
    ffmpegExecutable?: string;
    workingDirectory?: string;
    generateSubdirectoryForSession?: boolean;
    printMessages?: boolean;
    cleanSegmentFiles?: boolean;
    ensureDirectoryExists?: boolean;
    retryTimesIfRecordingExitedAbnormally?: number;
    automaticallyCreateOutfileIfExitedAbnormally?: boolean;
}

export interface RecorderOptions extends RecorderStandardOptions {
    outfile?: string;
    onStart?: () => void;
    onComplete?: () => void;
    onStateChange?: (
        newState: RecorderState,
        oldState?: RecorderState,
        sessionInfo?: SessionInfo
    ) => void;
}

export const defaultRecorderOptions: RecorderOptions = {
    workingDirectory: __dirname,
    generateSubdirectoryForSession: true,
    printMessages: false,
    cleanSegmentFiles: true,
    ensureDirectoryExists: true,
    retryTimesIfRecordingExitedAbnormally: 0,
    automaticallyCreateOutfileIfExitedAbnormally: true,
};

export class Recorder {
    private readonly _id: string;

    private _url: string;
    private _options: RecorderOptions;
    private _process?: FFmpegProcess;
    private _currentWorkingDirectory?: string;
    private _sessionInfo: SessionInfo;

    constructor(url: string, options?: RecorderOptions) {
        this._id = createUnique();
        this._url = url;
        this._options = { ...defaultRecorderOptions, ...options };
        this._sessionInfo = {
            recorderId: this._id,
            sessionUnique: this._id,
            state: RecorderState.INITIAL,
            startCounter: 0,
            retries: 0,
        };
    }

    /**
     * Unique recorder id e.g 19112814560452.
     */
    public get id(): string {
        return this._id;
    }

    /**
     * Informations about the current session.
     */
    public get sessionInfo(): SessionInfo {
        return this._sessionInfo;
    }

    /**
     * The current state.
     */
    public get state(): RecorderState {
        return this._sessionInfo.state;
    }

    /**
     * The URL to be recorded.
     */
    public get url(): string {
        return this._url;
    }

    /**
     * Sets the URL to record.
     * @param url Stream URL
     */
    public set url(url: string) {
        this._url = url;
    }

    /**
     * The options for the recorder.
     */
    public get options(): RecorderOptions {
        return this._options;
    }

    private setState(state: RecorderState) {
        if (state == RecorderState.RECORDING && this._options.onStart) {
            this._options.onStart();
        }
        if (state == RecorderState.FINISH && this._options.onComplete) {
            this._options.onComplete();
        }
        if (this._options.onStateChange) {
            this._options.onStateChange(
                state,
                this._sessionInfo.state,
                this._sessionInfo
            );
        }
        this.sessionInfo.state = state;
    }

    /**
     * Gets true if recorder is currently busy or false if not.
     * @returns Busy true/false
     */
    public isBusy(): boolean {
        if (this._process && this._process.isRunning()) {
            return true;
        }
        return (
            this._sessionInfo.state !== RecorderState.INITIAL &&
            this._sessionInfo.state !== RecorderState.FINISH &&
            this._sessionInfo.state !== RecorderState.EXITED_ABNORMALLY &&
            this._sessionInfo.state !== RecorderState.PAUSED
        );
    }

    /**
     * Gets a list of segment list files for the current
     * session which are used to create the output file.
     * @returns List of segment list files
     */
    public getSessionSegmentLists(): string[] {
        if (!this._currentWorkingDirectory) {
            return [];
        }
        return findFiles(
            this._currentWorkingDirectory,
            new RegExp(`seglist_${this._sessionInfo.sessionUnique}_\\d*\\.txt`)
        );
    }

    /**
     * Gets a list of segment files for the current session.
     * @return List of segment files
     */
    public getSessionSegmentFiles(): string[] {
        if (!this._currentWorkingDirectory) {
            return [];
        }
        return findFiles(
            this._currentWorkingDirectory,
            new RegExp(`seg_${this._sessionInfo.sessionUnique}_\\d*_\\d*\\.ts`)
        );
    }

    /**
     * Starts the recording.
     * @param url Stream URL
     */
    public start(url?: string) {
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
        if (url) {
            this._url = url;
        }
        if (this._sessionInfo.state != RecorderState.PAUSED) {
            this._sessionInfo.sessionUnique = createUnique();
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
                    this._sessionInfo.sessionUnique
                );
                if (!fs.existsSync(this._currentWorkingDirectory)) {
                    fs.mkdirSync(this._currentWorkingDirectory);
                }
            }
        }
        this._sessionInfo.startCounter = this._sessionInfo.startCounter + 1;
        this.recordForSession();
    }

    /**
     * Pauses the recording.
     */
    public pause() {
        this.setState(RecorderState.PAUSED);
        this.killProcess();
    }

    /**
     * Stops the recording and creats the output file.
     * @param outfile Target output filename
     */
    public stop(outfile?: string) {
        if (this._sessionInfo.state === RecorderState.FINISH) {
            return;
        }
        this.setState(RecorderState.STOPPING);
        this.killProcess();
        this.finish();
    }

    private finish(outfile?: string) {
        let out = this._options.outfile;
        if (outfile) {
            out = outfile;
        }
        if (out) {
            const dir = dirname(out);
            if (this._options.ensureDirectoryExists && !fs.existsSync(dir)) {
                console.log('Creating dir', out);
                fs.mkdirSync(dir);
            }
            console.log('Start file creating', out);
            this.createOutputFile(out, () => {
                this.cleanWorkingDirectory();
                this.setState(RecorderState.FINISH);
            });
        } else {
            console.warn('No output file specified');
            this.setState(RecorderState.FINISH);
        }
    }

    private killProcess() {
        if (this._process) {
            this._process.kill();
        }
    }

    private recordForSession() {
        this._process = new FFmpegProcess(this._options.ffmpegExecutable);
        this.setState(RecorderState.RECORDING);
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
                    this._sessionInfo.sessionUnique
                }_${this._sessionInfo.startCounter
                    .toString()
                    .padStart(2, '0')}.txt`,
                '-segment_list_entry_prefix',
                'file ',
                `seg_${
                    this._sessionInfo.sessionUnique
                }_${this._sessionInfo.startCounter
                    .toString()
                    .padStart(2, '0')}_%05d.ts`,
            ],
            {
                workDirectory: this._currentWorkingDirectory,
                printMessages: this._options.printMessages,
                onExit: (code: number, planned?: boolean) => {
                    if (planned !== undefined && !planned) {
                        this.setState(RecorderState.EXITED_ABNORMALLY);
                        if (
                            this._options
                                .retryTimesIfRecordingExitedAbnormally &&
                            this._options
                                .retryTimesIfRecordingExitedAbnormally > 0 &&
                            this._sessionInfo.retries <
                                this._options
                                    .retryTimesIfRecordingExitedAbnormally
                        ) {
                            this._sessionInfo.retries =
                                this._sessionInfo.retries + 1;
                            console.log(
                                'Retry recorder no. ' +
                                    this._sessionInfo.retries
                            );
                            setTimeout(() => {
                                this.recordForSession();
                            }, 2000);
                        } else if (
                            this._options
                                .automaticallyCreateOutfileIfExitedAbnormally
                        ) {
                            console.log('Automatically finishing...');
                            this.finish();
                        }
                    }
                },
            }
        );
    }

    @Delayed(500)
    private createOutputFile(outfile: string, onProcessFinish: () => void) {
        if (
            (this._process && this._process.isRunning()) ||
            !this._currentWorkingDirectory
        ) {
            return;
        }
        this.setState(RecorderState.CREATINGOUTFILE);
        let args: string[];
        const tsFiles = this.getSessionSegmentFiles();
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
        const segLists = this.getSessionSegmentLists();
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
                `seglist_${this._sessionInfo.sessionUnique}_merged.txt`
            );
            mergeFiles(segLists, mergedOutFile);
            return mergedOutFile;
        }
    }

    @Delayed(500)
    private cleanWorkingDirectory() {
        if (
            !this._options.cleanSegmentFiles ||
            !this._currentWorkingDirectory ||
            !fs.existsSync(this._currentWorkingDirectory)
        ) {
            return;
        }
        if (this._options.generateSubdirectoryForSession) {
            deleteFolderRecursive(this._currentWorkingDirectory);
        } else {
            this.setState(RecorderState.CLEANING);
            this.getSessionSegmentFiles().forEach((f) => {
                fs.unlinkSync(f);
            });
            this.getSessionSegmentLists().forEach((f) => {
                fs.unlinkSync(f);
            });
            const mergedSegmentList = join(
                this._currentWorkingDirectory,
                `seglist_${this._sessionInfo.sessionUnique}_merged.txt`
            );
            if (fs.existsSync(mergedSegmentList)) {
                fs.unlinkSync(mergedSegmentList);
            }
        }
    }
}
