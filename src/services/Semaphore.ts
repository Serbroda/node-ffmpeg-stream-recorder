type FunctionWithNext = (next: () => void) => any;
export class Semaphore {
    private _max: number;
    private _functions: FunctionWithNext[] = [];
    private _active: number = 0;

    constructor(max?: number) {
        this._max = max ? max : 1;
    }

    get remaining() {
        return this._functions.length;
    }

    get active() {
        return this._active;
    }

    take(fn: (next: () => void) => any) {
        this._functions.push(fn);
        this._try();
    }

    _done() {
        this._active -= 1;
        this._try();
    }

    _try() {
        if (this._active === this._max || this._functions.length === 0) {
            return;
        }
        let fn = this._functions.shift();
        this._active += 1;
        if (fn) {
            fn!(() => this._done());
        }
    }
}
