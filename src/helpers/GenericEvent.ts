export interface IGenericEvent<T> {
    on(handler: { (data: T): void }): void;
    once(handler: { (data: T): void }): void;
    off(handler: { (data: T): void }): void;
}

export class GenericEvent<T> implements IGenericEvent<T> {
    private _handlers: { (data: T): void }[] = [];
    private _onceHandlers: { (data: T): void }[] = [];

    public on(handler: { (data: T): void }): void {
        if (!this.has(handler, this._handlers)) {
            this._handlers.push(handler);
        }
    }

    public once(handler: (data: T) => void): void {
        if (!this.has(handler, this._onceHandlers)) {
            this._onceHandlers.push(handler);
        }
    }

    public off(handler: { (data: T): void }): void {
        this._handlers = this._handlers.filter((h) => h !== handler);
        this._onceHandlers = this._onceHandlers.filter((h) => h !== handler);
    }

    public trigger(data: T, delayed: number = 0) {
        setTimeout(() => {
            this._handlers.slice(0).forEach((h) => h(data));

            this._onceHandlers.slice(0).forEach((h) => h(data));
            this._onceHandlers = [];
        }, delayed);
    }

    public expose(): IGenericEvent<T> {
        return this;
    }

    private has(handler: { (data: T): void }, base: { (data: T): void }[]): boolean {
        return base.filter((h) => h === handler).length > 0;
    }
}
