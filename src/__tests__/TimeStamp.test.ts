import { TimeStamp, TimeStampUnit, TimeStampParts } from '../models/TimeStamp';

jest.setTimeout(20 * 1000);

it('should create TimeStamp', () => {
    expect(() => new TimeStamp('asd')).toThrow(Error);
    expect(() => new TimeStamp('000:01:11')).toThrow(Error);
    expect(() => new TimeStamp('00:00:01:00')).toThrow(Error);
    expect(() => TimeStamp.of('00:00:01:00')).toThrow(Error);
    expect(() => TimeStamp.of('00:00:01')).not.toThrow(Error);
    expect(() => TimeStamp.of(25, TimeStampUnit.MILLISECONDS)).not.toThrow(Error);
    expect(() => TimeStamp.of(25, TimeStampUnit.SECONDS)).not.toThrow(Error);
    expect(() => TimeStamp.of(25, TimeStampUnit.MINUTES)).not.toThrow(Error);
    expect(() => TimeStamp.of(25, TimeStampUnit.HOURS)).not.toThrow(Error);
});

it('should create TimeStamp with correct values', () => {
    const t1 = new TimeStamp('12:04:25');
    expect(t1.seconds()).toBe(43465);
    assertTimeStampParts({ hours: 12, minutes: 4, seconds: 25 }, t1.value);
    assertTimeStampParts({ hours: 12, minutes: 4, seconds: 25 }, TimeStamp.of('12:04:25').value);
    assertTimeStampParts({ hours: 0, minutes: 0, seconds: 44 }, new TimeStamp('00:00:44').value);
    assertTimeStampParts(
        { hours: 12, minutes: 4, seconds: 25 },
        TimeStamp.of(43465.41667, TimeStampUnit.SECONDS).value
    );
    assertTimeStampParts(
        { hours: 12, minutes: 4, seconds: 25 },
        TimeStamp.of(43465000, TimeStampUnit.MILLISECONDS).value
    );
    assertTimeStampParts({ hours: 12, minutes: 4, seconds: 25 }, TimeStamp.of(724.41667, TimeStampUnit.MINUTES).value);
    assertTimeStampParts({ hours: 12, minutes: 4, seconds: 0 }, TimeStamp.of(724, TimeStampUnit.MINUTES).value);
    assertTimeStampParts(
        { hours: 12, minutes: 4, seconds: 25 },
        TimeStamp.of(12.0736111667, TimeStampUnit.HOURS).value
    );
    assertTimeStampParts({ hours: 12, minutes: 0, seconds: 0 }, TimeStamp.of(12, TimeStampUnit.HOURS).value);
    expect(TimeStamp.of(724.41667, TimeStampUnit.MINUTES).toString()).toBe('12:04:25');
});

it('should calculate TimeStamps', () => {
    assertTimeStampParts({ hours: 13, minutes: 10, seconds: 30 }, TimeStamp.add('12:04:25', '01:06:05').value);
    assertTimeStampParts({ hours: 1, minutes: 11, seconds: 26 }, TimeStamp.add('00:57:25', '00:14:01').value);
    assertTimeStampParts({ hours: 0, minutes: 49, seconds: 55 }, TimeStamp.subtract('00:57:25', '00:07:30').value);
    assertTimeStampParts({ hours: 0, minutes: 10, seconds: 6 }, TimeStamp.between('00:57:25', '01:07:31').value);
});

function assertTimeStampParts(actual: TimeStampParts, expected: TimeStampParts) {
    expect(expected.hours).toBe(actual.hours);
    expect(expected.minutes).toBe(actual.minutes);
    expect(expected.seconds).toBe(actual.seconds);
}
