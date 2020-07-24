export interface IGenericEvent<T> {
    on(handler: {
        (data: T): void;
    }): void;
    once(handler: {
        (data: T): void;
    }): void;
    off(handler: {
        (data: T): void;
    }): void;
}
export declare class GenericEvent<T> implements IGenericEvent<T> {
    private _handlers;
    private _onceHandlers;
    on(handler: {
        (data: T): void;
    }): void;
    once(handler: (data: T) => void): void;
    off(handler: {
        (data: T): void;
    }): void;
    trigger(data: T, delayed?: number): void;
    expose(): IGenericEvent<T>;
    private has;
}
