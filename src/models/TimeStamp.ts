const TIMESTAMP_PATTERN = /^(?<hours>[0-9]{2}):(?<minutes>[0-9]{2}):(?<seconds>[0-9]{2})$/;
type CalcOperation = 'add' | 'subtract';

export interface TimeStampParts {
    hours: number;
    minutes: number;
    seconds: number;
}

export class TimeStamp {
    private _timeStamp: TimeStampParts;

    constructor(timeStamp: string | TimeStampParts) {
        if (typeof timeStamp === 'string') {
            this._timeStamp = TimeStamp.parse(timeStamp);
        } else {
            this._timeStamp = timeStamp;
        }
    }

    get value(): TimeStampParts {
        return this._timeStamp;
    }

    seconds(): number {
        return this.value.seconds + this.value.minutes * 60 + this.value.hours * 60 * 60;
    }

    add(time: string): TimeStamp;
    add(time: TimeStamp): TimeStamp;
    add(time: number, unit: TimeStampUnit): TimeStamp;
    add(time: string | number | TimeStamp, unit?: TimeStampUnit): TimeStamp {
        const operator = 'add';
        if (typeof time === 'string') {
            return this.calc(operator, time);
        } else if (typeof time === 'number') {
            return this.calc(operator, time, unit!);
        } else {
            return this.calc(operator, time);
        }
    }

    subtract(time: string): TimeStamp;
    subtract(time: TimeStamp): TimeStamp;
    subtract(time: number, unit: TimeStampUnit): TimeStamp;
    subtract(time: string | number | TimeStamp, unit?: TimeStampUnit): TimeStamp {
        const operator = 'subtract';
        if (typeof time === 'string') {
            return this.calc(operator, time);
        } else if (typeof time === 'number') {
            return this.calc(operator, time, unit!);
        } else {
            return this.calc(operator, time);
        }
    }

    calc(operation: CalcOperation, time: string): TimeStamp;
    calc(operation: CalcOperation, time: TimeStamp): TimeStamp;
    calc(operation: CalcOperation, time: number, unit: TimeStampUnit): TimeStamp;
    calc(operation: CalcOperation, time: string | number | TimeStamp, unit?: TimeStampUnit): TimeStamp {
        let s = 0;
        if (typeof time === 'string') {
            s = TimeStamp.of(time).seconds();
        } else if (typeof time === 'number') {
            s = TimeStamp.of(time, unit!).seconds();
        } else {
            s = time.seconds();
        }
        if (operation === 'add') {
            return TimeStamp.of(this.seconds() + s, TimeStampUnit.SECONDS);
        } else {
            return TimeStamp.of(this.seconds() - s, TimeStampUnit.SECONDS);
        }
    }

    toString(): string {
        return `${this.value.hours < 10 ? '0' : ''}${this.value.hours}:${this.value.minutes < 10 ? '0' : ''}${
            this.value.minutes
        }:${this.value.seconds < 10 ? '0' : ''}${this.value.seconds}`;
    }

    static of(time: string): TimeStamp;
    static of(time: number, unit: TimeStampUnit): TimeStamp;
    static of(time: string | number, unit?: TimeStampUnit): TimeStamp {
        if (typeof time === 'string') {
            return new TimeStamp(time);
        } else {
            let secs: number;
            switch (unit) {
                case TimeStampUnit.MILLISECONDS:
                    secs = time / 1000;
                    break;
                case TimeStampUnit.SECONDS:
                    secs = time;
                    break;
                case TimeStampUnit.MINUTES:
                    secs = time * 60;
                    break;
                case TimeStampUnit.HOURS:
                    secs = time * 60 * 60;
                    break;
            }
            secs = Math.trunc(secs!);
            const hours = Math.floor(secs / 3600);
            const minutes = Math.floor((secs - hours * 3600) / 60);
            const seconds = secs - hours * 3600 - minutes * 60;
            return new TimeStamp({
                hours: hours < 0 ? 0 : hours,
                minutes: minutes < 0 ? 0 : minutes,
                seconds: seconds < 0 ? 0 : seconds,
            });
        }
    }

    static isTimeStamp(text: string): boolean {
        return TIMESTAMP_PATTERN.test(text);
    }

    static parse(text: string): TimeStampParts {
        if (!TimeStamp.isTimeStamp(text)) {
            throw new Error(`'${text}' is no valid timestamp`);
        }
        const match = TIMESTAMP_PATTERN.exec(text);
        return {
            hours: Number(match?.groups?.hours) || 0,
            minutes: Number(match?.groups?.minutes) || 0,
            seconds: Number(match?.groups?.seconds) || 0,
        };
    }

    static add(timeStamp1: string, timeStamp2: string): TimeStamp;
    static add(timeStamp1: TimeStamp, timeStamp2: TimeStamp): TimeStamp;
    static add(timeStamp1: string | TimeStamp, timeStamp2: string | TimeStamp): TimeStamp {
        if (typeof timeStamp1 === 'string' && typeof timeStamp2 === 'string') {
            return TimeStamp.of(timeStamp1).add(TimeStamp.of(timeStamp2));
        } else {
            return (timeStamp1 as TimeStamp).add(timeStamp2 as TimeStamp);
        }
    }

    static subtract(timeStamp1: string, timeStamp2: string): TimeStamp;
    static subtract(timeStamp1: TimeStamp, timeStamp2: TimeStamp): TimeStamp;
    static subtract(timeStamp1: string | TimeStamp, timeStamp2: string | TimeStamp): TimeStamp {
        if (typeof timeStamp1 === 'string' && typeof timeStamp2 === 'string') {
            return TimeStamp.of(timeStamp1).subtract(TimeStamp.of(timeStamp2));
        } else {
            return (timeStamp1 as TimeStamp).subtract(timeStamp2 as TimeStamp);
        }
    }

    static calc(operation: CalcOperation, timeStamp1: string, timeStamp2: string): TimeStamp;
    static calc(operation: CalcOperation, timeStamp1: TimeStamp, timeStamp2: TimeStamp): TimeStamp;
    static calc(operation: CalcOperation, timeStamp1: string | TimeStamp, timeStamp2: string | TimeStamp): TimeStamp {
        if (typeof timeStamp1 === 'string' && typeof timeStamp2 === 'string') {
            return TimeStamp.of(timeStamp1).calc(operation, TimeStamp.of(timeStamp2));
        } else {
            return (timeStamp1 as TimeStamp).calc(operation, timeStamp2 as TimeStamp);
        }
    }

    static between(start: string, end: string): TimeStamp;
    static between(start: TimeStamp, end: TimeStamp): TimeStamp;
    static between(start: string | TimeStamp, end: string | TimeStamp): TimeStamp {
        if (typeof start === 'string' && typeof end === 'string') {
            return TimeStamp.of(end).subtract(TimeStamp.of(start));
        } else {
            return (end as TimeStamp).subtract(start as TimeStamp);
        }
    }
}

export enum TimeStampUnit {
    MILLISECONDS,
    SECONDS,
    MINUTES,
    HOURS,
}
