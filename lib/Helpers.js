"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeFiles = exports.findFiles = exports.generateRandomNumber = exports.padStartNumber = exports.createUnique = exports.sleep = void 0;
var path_1 = require("path");
var fs = __importStar(require("fs"));
exports.sleep = function (ms) {
    return new Promise(function (resolve) {
        setTimeout(resolve, ms);
    });
};
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
exports.findFiles = function (rootDirectory, pattern) {
    var files = fs.readdirSync(rootDirectory);
    if (pattern) {
        return files
            .filter(function (f) {
            return !fs.statSync(path_1.join(rootDirectory, f)).isDirectory() &&
                pattern.test(f);
        })
            .map(function (f) { return path_1.join(rootDirectory, f); });
    }
    else {
        return files
            .filter(function (f) { return !fs.statSync(path_1.join(rootDirectory, f)).isDirectory(); })
            .map(function (f) { return path_1.join(rootDirectory, f); });
    }
};
exports.mergeFiles = function (files, outfile) {
    files.forEach(function (f) {
        fs.appendFileSync(outfile, fs.readFileSync(f));
    });
};
