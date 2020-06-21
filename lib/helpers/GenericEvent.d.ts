interface IGenericEvent<T> {
    register(handler: {
        (data: T): void;
    }): void;
    unregister(handler: {
        (data: T): void;
    }): void;
}
declare class GenericEvent<T> implements IGenericEvent<T> {
    private _handlers;
    register(handler: {
        (data: T): void;
    }): void;
    unregister(handler: {
        (data: T): void;
    }): void;
    trigger(data: T): void;
    expose(): IGenericEvent<T>;
    private has;
}
