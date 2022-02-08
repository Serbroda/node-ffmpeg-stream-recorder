"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeStampUnit = exports.TimeStamp = void 0;
var TIMESTAMP_PATTERN = /^(?<hours>[0-9]{2}):(?<minutes>[0-9]{2}):(?<seconds>[0-9]{2})$/;
var TimeStamp = /** @class */ (function () {
    function TimeStamp(timeStamp) {
        if (typeof timeStamp === 'string') {
            this._timeStamp = TimeStamp.parse(timeStamp);
        }
        else {
            this._timeStamp = timeStamp;
        }
    }
    Object.defineProperty(TimeStamp.prototype, "value", {
        get: function () {
            return this._timeStamp;
        },
        enumerable: false,
        configurable: true
    });
    TimeStamp.prototype.seconds = function () {
        return this.value.seconds + this.value.minutes * 60 + this.value.hours * 60 * 60;
    };
    TimeStamp.prototype.add = function (time, unit) {
        var operator = 'add';
        if (typeof time === 'string') {
            return this.calc(operator, time);
        }
        else if (typeof time === 'number') {
            return this.calc(operator, time, unit);
        }
        else {
            return this.calc(operator, time);
        }
    };
    TimeStamp.prototype.subtract = function (time, unit) {
        var operator = 'subtract';
        if (typeof time === 'string') {
            return this.calc(operator, time);
        }
        else if (typeof time === 'number') {
            return this.calc(operator, time, unit);
        }
        else {
            return this.calc(operator, time);
        }
    };
    TimeStamp.prototype.calc = function (operation, time, unit) {
        var s = 0;
        if (typeof time === 'string') {
            s = TimeStamp.of(time).seconds();
        }
        else if (typeof time === 'number') {
            s = TimeStamp.of(time, unit).seconds();
        }
        else {
            s = time.seconds();
        }
        if (operation === 'add') {
            return TimeStamp.of(this.seconds() + s, TimeStampUnit.SECONDS);
        }
        else {
            return TimeStamp.of(this.seconds() - s, TimeStampUnit.SECONDS);
        }
    };
    TimeStamp.prototype.toString = function () {
        return "" + (this.value.hours < 10 ? '0' : '') + this.value.hours + ":" + (this.value.minutes < 10 ? '0' : '') + this.value.minutes + ":" + (this.value.seconds < 10 ? '0' : '') + this.value.seconds;
    };
    TimeStamp.of = function (time, unit) {
        if (typeof time === 'string') {
            return new TimeStamp(time);
        }
        else {
            var secs = void 0;
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
            secs = Math.trunc(secs);
            var hours = Math.floor(secs / 3600);
            var minutes = Math.floor((secs - hours * 3600) / 60);
            var seconds = secs - hours * 3600 - minutes * 60;
            return new TimeStamp({
                hours: hours < 0 ? 0 : hours,
                minutes: minutes < 0 ? 0 : minutes,
                seconds: seconds < 0 ? 0 : seconds,
            });
        }
    };
    TimeStamp.isTimeStamp = function (text) {
        return TIMESTAMP_PATTERN.test(text);
    };
    TimeStamp.parse = function (text) {
        var _a, _b, _c;
        if (!TimeStamp.isTimeStamp(text)) {
            throw new Error("'" + text + "' is no valid timestamp");
        }
        var match = TIMESTAMP_PATTERN.exec(text);
        return {
            hours: Number((_a = match === null || match === void 0 ? void 0 : match.groups) === null || _a === void 0 ? void 0 : _a.hours) || 0,
            minutes: Number((_b = match === null || match === void 0 ? void 0 : match.groups) === null || _b === void 0 ? void 0 : _b.minutes) || 0,
            seconds: Number((_c = match === null || match === void 0 ? void 0 : match.groups) === null || _c === void 0 ? void 0 : _c.seconds) || 0,
        };
    };
    TimeStamp.add = function (timeStamp1, timeStamp2) {
        if (typeof timeStamp1 === 'string' && typeof timeStamp2 === 'string') {
            return TimeStamp.of(timeStamp1).add(TimeStamp.of(timeStamp2));
        }
        else {
            return timeStamp1.add(timeStamp2);
        }
    };
    TimeStamp.subtract = function (timeStamp1, timeStamp2) {
        if (typeof timeStamp1 === 'string' && typeof timeStamp2 === 'string') {
            return TimeStamp.of(timeStamp1).subtract(TimeStamp.of(timeStamp2));
        }
        else {
            return timeStamp1.subtract(timeStamp2);
        }
    };
    TimeStamp.calc = function (operation, timeStamp1, timeStamp2) {
        if (typeof timeStamp1 === 'string' && typeof timeStamp2 === 'string') {
            return TimeStamp.of(timeStamp1).calc(operation, TimeStamp.of(timeStamp2));
        }
        else {
            return timeStamp1.calc(operation, timeStamp2);
        }
    };
    TimeStamp.between = function (start, end) {
        if (typeof start === 'string' && typeof end === 'string') {
            return TimeStamp.of(end).subtract(TimeStamp.of(start));
        }
        else {
            return end.subtract(start);
        }
    };
    return TimeStamp;
}());
exports.TimeStamp = TimeStamp;
var TimeStampUnit;
(function (TimeStampUnit) {
    TimeStampUnit[TimeStampUnit["MILLISECONDS"] = 0] = "MILLISECONDS";
    TimeStampUnit[TimeStampUnit["SECONDS"] = 1] = "SECONDS";
    TimeStampUnit[TimeStampUnit["MINUTES"] = 2] = "MINUTES";
    TimeStampUnit[TimeStampUnit["HOURS"] = 3] = "HOURS";
})(TimeStampUnit = exports.TimeStampUnit || (exports.TimeStampUnit = {}));
