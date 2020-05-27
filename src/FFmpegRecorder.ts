import { FFmpegProcess } from './FFmpegProcess';
import { createDateTimeString, findFiles } from './Helpers';
import { join } from 'path';
import * as fs from 'fs';

export enum FFmpegRecorderState {
    NONE,
    RECORDING,
    STOPPED,
    FINISHED,
}

export class FFmpegRecorder {
    private ffmpegProcess: FFmpegProcess | null = null;
    private currentWorkingDirectory: string | null = null;
    private state: FFmpegRecorderState = FFmpegRecorderState.NONE;

    constructor(private ffmpegExecutable?: string) {}

    public record(url: string, workingDirectory?: string) {
        if (this.ffmpegProcess && this.ffmpegProcess.isRunning()) {
            return;
        }
        this.state = FFmpegRecorderState.RECORDING;
        this.currentWorkingDirectory = join(
            workingDirectory ? workingDirectory : __dirname,
            createDateTimeString()
        );
        if (!fs.existsSync(this.currentWorkingDirectory)) {
            fs.mkdirSync(this.currentWorkingDirectory);
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
                'seg_%05d.ts',
            ],
            {
                workDirectory: this.currentWorkingDirectory,
            }
        );
    }

    public finish(outfile: string) {
        if (
            (this.ffmpegProcess && this.ffmpegProcess.isRunning()) ||
            !this.currentWorkingDirectory
        ) {
            return;
        }
        let args: string[];
        let tsFiles = findFiles(this.currentWorkingDirectory, /seg_\d*\.ts/);
        if (tsFiles.length > 1) {
            args = ['-f', 'concat', '-i', 'out.ffcat', '-c', 'copy', outfile];
        } else {
            args = ['-i', tsFiles[0], '-map', '0', '-c', 'copy', outfile];
        }
        this.ffmpegProcess?.start(args, {
            workDirectory: this.currentWorkingDirectory,
            onExit: (code: number) => {
                this.clean();
            },
        });
    }

    public stop() {
        if (this.ffmpegProcess) {
            this.ffmpegProcess.kill();
        }
        this.state = FFmpegRecorderState.STOPPED;
    }

    public clean() {
        if (this.currentWorkingDirectory) {
            this.deleteFiles(this.currentWorkingDirectory, /seg_\d*\.ts/);
            this.deleteFiles(this.currentWorkingDirectory, /out\.ffcat/);
        }
    }

    private deleteFiles(dir: string, pattern?: RegExp) {
        findFiles(dir, pattern).forEach((f) => {
            fs.unlinkSync(f);
        });
    }
}
