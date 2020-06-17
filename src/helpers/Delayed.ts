import { sleep } from './ThreadingHelper';

export function Delayed(millis: number) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        let originalMethod = descriptor.value;
        descriptor.value = function (...args: any[]) {
            sleep(millis);
            let result = originalMethod.apply(this, args);
            return result;
        };
    };
}
