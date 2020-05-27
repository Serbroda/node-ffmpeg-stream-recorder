import { FFmpegProcess, FFmpegProcessOptions } from './FFmpegProcess';
import { createUnique, findFiles } from './Helpers';
import { join } from 'path';
import * as fs from 'fs';

export enum FFmpegRecorderState {
    NONE,
    RECORDING,
    STOPPING,
    FINISHING,
    CLEANING,
    DONE,
}

export interface FFmpegRecorderOptions {
    workingDirectory?: string;
    onStateChange?: (
        newState: FFmpegRecorderState,
        oldState?: FFmpegRecorderState
    ) => void;
}

export class FFmpegRecorder {
    private ffmpegProcess: FFmpegProcess | null = null;
    private workingDirectory: string = '';
    private uniqueWorkingDirectory: string | null = null;
    private _state: FFmpegRecorderState = FFmpegRecorderState.NONE;
    private options: FFmpegRecorderOptions | null = null;

    constructor(private ffmpegExecutable?: string) {}

    public get state(): FFmpegRecorderState {
        return this._state;
    }

    private setState(state: FFmpegRecorderState) {
        if (this.options?.onStateChange) {
            this.options.onStateChange(this._state, state);
        }
        this._state = state;
    }

    public isBusy(): boolean {
        return (
            !this.ffmpegProcess?.isRunning() &&
            this._state !== FFmpegRecorderState.NONE &&
            this._state !== FFmpegRecorderState.DONE
        );
    }

    public record(url: string, options?: FFmpegRecorderOptions) {
        if (this.ffmpegProcess && this.ffmpegProcess.isRunning()) {
            return;
        }
        this.setState(FFmpegRecorderState.RECORDING);
        const unique = createUnique();
        this.workingDirectory = options?.workingDirectory
            ? options?.workingDirectory
            : __dirname;
        this.uniqueWorkingDirectory = join(this.workingDirectory, unique);
        if (!fs.existsSync(this.uniqueWorkingDirectory)) {
            fs.mkdirSync(this.uniqueWorkingDirectory);
        }
        this.ffmpegProcess = new FFmpegProcess(this.ffmpegExecutable);
        this.ffmpegProcess.start(
            [
                '-y',
                '-i',
                url,
                '-c:v',
                'copy',
                '-c:a',
                'copy',
                '-f',
                'segment',
                '-segment_list',
                'out.ffcat',
                unique + '_%05d.ts',
            ],
            {
                workDirectory: this.uniqueWorkingDirectory,
            }
        );
    }

    public finish(outfile: string) {
        if (
            (this.ffmpegProcess && this.ffmpegProcess.isRunning()) ||
            !this.uniqueWorkingDirectory
        ) {
            return;
        }
        this.setState(FFmpegRecorderState.FINISHING);

        let args: string[];
        let tsFiles = findFiles(this.uniqueWorkingDirectory, /.*_\d*\.ts/);
        const outfileAbsolute = join(this.workingDirectory, outfile);
        if (tsFiles.length > 1) {
            args = [
                '-f',
                'concat',
                '-i',
                'out.ffcat',
                '-c',
                'copy',
                outfileAbsolute,
            ];
        } else {
            args = [
                '-i',
                tsFiles[0],
                '-map',
                '0',
                '-c',
                'copy',
                outfileAbsolute,
            ];
        }
        this.ffmpegProcess?.start(args, {
            workDirectory: this.uniqueWorkingDirectory,
            onExit: (code: number) => {
                this.clean();
                this.setState(FFmpegRecorderState.DONE);
            },
        });
    }

    public stop() {
        if (this.ffmpegProcess) {
            this.setState(FFmpegRecorderState.STOPPING);
            this.ffmpegProcess.kill();
        }
    }

    public clean() {
        if (this.uniqueWorkingDirectory) {
            this.setState(FFmpegRecorderState.CLEANING);
            this.deleteFiles(this.uniqueWorkingDirectory, /.*_\d*\.ts/);
            this.deleteFiles(this.uniqueWorkingDirectory, /out\.ffcat/);
            fs.rmdirSync(this.uniqueWorkingDirectory);
        }
    }

    private deleteFiles(dir: string, pattern?: RegExp) {
        findFiles(dir, pattern).forEach((f) => {
            fs.unlinkSync(f);
        });
    }
}
