declare type CalcOperation = 'add' | 'subtract';
export interface TimeStampParts {
    hours: number;
    minutes: number;
    seconds: number;
}
export declare class TimeStamp {
    private _timeStamp;
    constructor(timeStamp: string | TimeStampParts);
    get value(): TimeStampParts;
    seconds(): number;
    add(time: string): TimeStamp;
    add(time: TimeStamp): TimeStamp;
    add(time: number, unit: TimeStampUnit): TimeStamp;
    subtract(time: string): TimeStamp;
    subtract(time: TimeStamp): TimeStamp;
    subtract(time: number, unit: TimeStampUnit): TimeStamp;
    calc(operation: CalcOperation, time: string): TimeStamp;
    calc(operation: CalcOperation, time: TimeStamp): TimeStamp;
    calc(operation: CalcOperation, time: number, unit: TimeStampUnit): TimeStamp;
    toString(): string;
    static of(time: string): TimeStamp;
    static of(time: number, unit: TimeStampUnit): TimeStamp;
    static isTimeStamp(text: string): boolean;
    static parse(text: string): TimeStampParts;
    static add(timeStamp1: string, timeStamp2: string): TimeStamp;
    static add(timeStamp1: TimeStamp, timeStamp2: TimeStamp): TimeStamp;
    static subtract(timeStamp1: string, timeStamp2: string): TimeStamp;
    static subtract(timeStamp1: TimeStamp, timeStamp2: TimeStamp): TimeStamp;
    static calc(operation: CalcOperation, timeStamp1: string, timeStamp2: string): TimeStamp;
    static calc(operation: CalcOperation, timeStamp1: TimeStamp, timeStamp2: TimeStamp): TimeStamp;
    static between(start: string, end: string): TimeStamp;
    static between(start: TimeStamp, end: TimeStamp): TimeStamp;
}
export declare enum TimeStampUnit {
    MILLISECONDS = 0,
    SECONDS = 1,
    MINUTES = 2,
    HOURS = 3
}
export {};
