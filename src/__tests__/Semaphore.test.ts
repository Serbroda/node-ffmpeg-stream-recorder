import { Semaphore } from '../services/Semaphore';

jest.setTimeout(20 * 1000);

it('should work', (done: jest.DoneCallback) => {
    let counter = 0;
    const callback = () => {
        counter++;
        console.log('Counter', counter);
        if (counter >= 4) {
            done();
        }
    };
    const sem = new Semaphore(4);

    sem.take((next) =>
        setTimeout(() => {
            callback();
            next();
        }, 2000)
    );

    sem.take((next) =>
        setTimeout(() => {
            callback();
            next();
        }, 2000)
    );

    sem.take((next) =>
        setTimeout(() => {
            callback();
            next();
        }, 2000)
    );

    sem.take((next) =>
        setTimeout(() => {
            callback();
            next();
        }, 2000)
    );
});
