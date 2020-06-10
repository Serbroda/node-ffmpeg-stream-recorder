"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Semaphore = void 0;
var Semaphore = /** @class */ (function () {
    function Semaphore(max) {
        this._functions = [];
        this._active = 0;
        this._max = max ? max : 1;
    }
    Object.defineProperty(Semaphore.prototype, "remaining", {
        get: function () {
            return this._functions.length;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Semaphore.prototype, "active", {
        get: function () {
            return this._active;
        },
        enumerable: false,
        configurable: true
    });
    Semaphore.prototype.take = function (fn) {
        this._functions.push(fn);
        this._try();
    };
    Semaphore.prototype._done = function () {
        this._active -= 1;
        this._try();
    };
    Semaphore.prototype._try = function () {
        if (this._active === this._max || this._functions.length === 0) {
            return;
        }
        var fn = this._functions.shift();
        this._active += 1;
        if (fn) {
            fn(this._done.bind(this));
        }
    };
    return Semaphore;
}());
exports.Semaphore = Semaphore;
