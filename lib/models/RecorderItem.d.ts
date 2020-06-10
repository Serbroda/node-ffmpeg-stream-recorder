import { RecorderState } from './RecorderState';
export interface IRecorderItem {
    id?: string;
    name: string;
    url: string;
    state?: RecorderState;
    outfile: string;
    data?: any;
}
export declare type RecorderItemOrId = IRecorderItem | string;
