export interface IRecorderItem {
    id?: string;
    name: string;
    url: string;
    state: any;
    outfile: string;
    data?: any;
}

export type RecorderItemOrId = IRecorderItem | string;
