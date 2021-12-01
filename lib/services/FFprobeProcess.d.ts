export interface FFmprobeOptions {
    cwd: string;
}
export declare class FFprobeProcess {
    private _childProcess;
    exec(args: string[], options?: Partial<FFmprobeOptions>): Promise<any>;
    private parseMessage;
}
