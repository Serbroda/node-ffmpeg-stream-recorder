"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRandomNumber = exports.padStartNumber = exports.createUnique = void 0;
exports.createUnique = function (date) {
    var dt = date ? date : new Date();
    var year = dt.getFullYear().toString().substr(-2);
    var month = exports.padStartNumber(dt.getMonth(), 2, '0');
    var day = exports.padStartNumber(dt.getDate(), 2, '0');
    var hours = exports.padStartNumber(dt.getHours(), 2, '0');
    var minutes = exports.padStartNumber(dt.getMinutes(), 2, '0');
    var seconds = exports.padStartNumber(dt.getSeconds(), 2, '0');
    var milliseconds = exports.padStartNumber(dt.getMilliseconds(), 3, '0');
    var random = exports.generateRandomNumber({ min: 1, max: 9 });
    return "" + year + month + day + hours + minutes + seconds + milliseconds + random;
};
exports.padStartNumber = function (value, length, char) {
    return value.toString().padStart(length, char);
};
exports.generateRandomNumber = function (opt) {
    var min = (opt === null || opt === void 0 ? void 0 : opt.min) ? opt === null || opt === void 0 ? void 0 : opt.min : 0;
    var max = (opt === null || opt === void 0 ? void 0 : opt.max) ? opt === null || opt === void 0 ? void 0 : opt.max : 0;
    return Math.floor(Math.random() * (max - min + 1)) + min;
};
