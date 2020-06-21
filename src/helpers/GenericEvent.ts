export interface IGenericEvent<T> {
    register(handler: { (data: T): void }): void;
    unregister(handler: { (data: T): void }): void;
}

export class GenericEvent<T> implements IGenericEvent<T> {
    private _handlers: { (data: T): void }[] = [];

    public register(handler: { (data: T): void }): void {
        if (!this.has(handler)) {
            this._handlers.push(handler);
        }
    }

    public unregister(handler: { (data: T): void }): void {
        this._handlers = this._handlers.filter((h) => h !== handler);
    }

    public trigger(data: T) {
        this._handlers.slice(0).forEach((h) => h(data));
    }

    public expose(): IGenericEvent<T> {
        return this;
    }

    private has(handler: { (data: T): void }): boolean {
        return this._handlers.filter((h) => h === handler).length > 0;
    }
}
