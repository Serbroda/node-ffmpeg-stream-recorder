"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUniqueV2 = exports.generateRandomNumber = exports.padStartNumber = exports.createIsoDateTime = exports.createIsoDate = exports.createUnique = void 0;
exports.createUnique = function (date) {
    if (date === void 0) { date = new Date(); }
    var year = date.getFullYear().toString().substr(-2);
    var month = exports.padStartNumber(date.getMonth(), 2, '0');
    var day = exports.padStartNumber(date.getDate(), 2, '0');
    var hours = exports.padStartNumber(date.getHours(), 2, '0');
    var minutes = exports.padStartNumber(date.getMinutes(), 2, '0');
    var seconds = exports.padStartNumber(date.getSeconds(), 2, '0');
    var milliseconds = exports.padStartNumber(date.getMilliseconds(), 3, '0');
    var random = exports.generateRandomNumber({ min: 1, max: 9 });
    return "" + year + month + day + hours + minutes + seconds + milliseconds + random;
};
exports.createIsoDate = function (date) {
    if (date === void 0) { date = new Date(); }
    var year = date.getFullYear().toString().substr(-2);
    var month = exports.padStartNumber(date.getMonth(), 2, '0');
    var day = exports.padStartNumber(date.getDate(), 2, '0');
    return year + "-" + month + "-" + day;
};
exports.createIsoDateTime = function (date) {
    if (date === void 0) { date = new Date(); }
    var year = date.getFullYear().toString().substr(-2);
    var month = exports.padStartNumber(date.getMonth(), 2, '0');
    var day = exports.padStartNumber(date.getDate(), 2, '0');
    var hours = exports.padStartNumber(date.getHours(), 2, '0');
    var minutes = exports.padStartNumber(date.getMinutes(), 2, '0');
    var seconds = exports.padStartNumber(date.getSeconds(), 2, '0');
    return year + "-" + month + "-" + day + " " + hours + minutes + seconds;
};
exports.padStartNumber = function (value, length, char) {
    return value.toString().padStart(length, char);
};
exports.generateRandomNumber = function (opt) {
    var min = (opt === null || opt === void 0 ? void 0 : opt.min) ? opt === null || opt === void 0 ? void 0 : opt.min : 0;
    var max = (opt === null || opt === void 0 ? void 0 : opt.max) ? opt === null || opt === void 0 ? void 0 : opt.max : 100;
    return Math.floor(Math.random() * (max - min + 1)) + min;
};
exports.createUniqueV2 = function () {
    return (Date.now() + Math.round(Math.random() * Math.pow(36, 12))).toString(36);
};
