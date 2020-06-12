"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sleep = exports.sleepAsync = void 0;
exports.sleepAsync = function (millis) {
    return new Promise(function (resolve) {
        setTimeout(resolve, millis);
    });
};
exports.sleep = function (millis) {
    var date = Date.now();
    var currentDate = null;
    do {
        currentDate = Date.now();
    } while (currentDate - date < millis);
};
