export declare const ofType: <T>(obj: any, instance: any) => obj is T;
export interface FromJson<T, R extends T> {
    fromJson(obj: T, ...args: any): R;
}
export interface ToJson<T> {
    toJson(...args: any): T;
}
