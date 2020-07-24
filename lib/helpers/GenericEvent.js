"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenericEvent = void 0;
var GenericEvent = /** @class */ (function () {
    function GenericEvent() {
        this._handlers = [];
        this._onceHandlers = [];
    }
    GenericEvent.prototype.on = function (handler) {
        if (!this.has(handler, this._handlers)) {
            this._handlers.push(handler);
        }
    };
    GenericEvent.prototype.once = function (handler) {
        if (!this.has(handler, this._onceHandlers)) {
            this._onceHandlers.push(handler);
        }
    };
    GenericEvent.prototype.off = function (handler) {
        this._handlers = this._handlers.filter(function (h) { return h !== handler; });
        this._onceHandlers = this._onceHandlers.filter(function (h) { return h !== handler; });
    };
    GenericEvent.prototype.trigger = function (data, delayed) {
        var _this = this;
        if (delayed === void 0) { delayed = 0; }
        setTimeout(function () {
            _this._handlers.slice(0).forEach(function (h) { return h(data); });
            _this._onceHandlers.slice(0).forEach(function (h) { return h(data); });
            _this._onceHandlers = [];
        }, delayed);
    };
    GenericEvent.prototype.expose = function () {
        return this;
    };
    GenericEvent.prototype.has = function (handler, base) {
        return base.filter(function (h) { return h === handler; }).length > 0;
    };
    return GenericEvent;
}());
exports.GenericEvent = GenericEvent;
