"use strict";
var GenericEvent = /** @class */ (function () {
    function GenericEvent() {
        this._handlers = [];
    }
    GenericEvent.prototype.register = function (handler) {
        if (!this.has(handler)) {
            this._handlers.push(handler);
        }
    };
    GenericEvent.prototype.unregister = function (handler) {
        this._handlers = this._handlers.filter(function (h) { return h !== handler; });
    };
    GenericEvent.prototype.trigger = function (data) {
        this._handlers.slice(0).forEach(function (h) { return h(data); });
    };
    GenericEvent.prototype.expose = function () {
        return this;
    };
    GenericEvent.prototype.has = function (handler) {
        return this._handlers.filter(function (h) { return h === handler; }).length > 0;
    };
    return GenericEvent;
}());
