export interface FFmprobeOptions {
    cwd: string;
}
export declare class FFprobeProcess {
    private _childProcess;
    get pid(): number | undefined;
    exec(args: string[], options?: Partial<FFmprobeOptions>): Promise<any>;
    private parseMessage;
}
