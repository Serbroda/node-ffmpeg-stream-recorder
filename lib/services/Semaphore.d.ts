export declare class Semaphore {
    private _max;
    private _functions;
    private _active;
    constructor(max?: number);
    get remaining(): number;
    get active(): number;
    take(fn: (next: () => void) => any): void;
    _done(): void;
    _try(): void;
}
