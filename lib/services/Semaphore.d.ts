export declare class Semaphore {
    private _max;
    private _functions;
    private _active;
    constructor(max?: number);
    get remaining(): number;
    get active(): number;
    take(fn: Function): void;
    _done(): void;
    _try(): void;
}
