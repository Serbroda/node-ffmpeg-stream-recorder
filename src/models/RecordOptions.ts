import { Resolution } from './Resolution';

export interface VariantMapOption {
    mapIndex: number;
    resolution?: never;
}

export interface VariantResolutionOption {
    resolution: string | Resolution;
    mapIndex?: never;
}

export type VariantOption = VariantMapOption | VariantResolutionOption;

export interface RecordOptions {
    addTimestampToOutfile: boolean;
    variant?: VariantOption;
    ffmpegArgs: string[];
    checkExitContinuously?: boolean;
    workDirectory?: string;
}
