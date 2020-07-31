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
exports.mkdir = exports.tryDeleteFile = exports.tryDeleteFileTimes = exports.deleteFolderRecursive = exports.mergeFiles = exports.filenameMatchesPattern = exports.findFiles = void 0;
var path_1 = require("path");
var fs = __importStar(require("fs"));
var ThreadingHelper_1 = require("./ThreadingHelper");
exports.findFiles = function (rootDirectory, pattern) {
    var files = fs.readdirSync(rootDirectory);
    if (pattern) {
        return files
            .filter(function (f) { return !fs.statSync(path_1.join(rootDirectory, f)).isDirectory() && exports.filenameMatchesPattern(f, pattern); })
            .map(function (f) { return path_1.join(rootDirectory, f); });
    }
    else {
        return files
            .filter(function (f) { return !fs.statSync(path_1.join(rootDirectory, f)).isDirectory(); })
            .map(function (f) { return path_1.join(rootDirectory, f); });
    }
};
exports.filenameMatchesPattern = function (filename, pattern) {
    if (typeof pattern === 'string') {
        return new RegExp(pattern).test(filename);
    }
    else {
        return pattern.test(filename);
    }
};
exports.mergeFiles = function (files, outfile) {
    files.forEach(function (f) {
        fs.appendFileSync(outfile, fs.readFileSync(f));
    });
};
exports.deleteFolderRecursive = function (path, filesOnly) {
    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach(function (file, index) {
            var curPath = path_1.join(path, file);
            if (fs.lstatSync(curPath).isDirectory()) {
                // recurse
                exports.deleteFolderRecursive(curPath);
            }
            else {
                // delete file
                exports.tryDeleteFileTimes(curPath);
            }
        });
        if (filesOnly !== undefined && !filesOnly) {
            try {
                fs.rmdirSync(path);
            }
            catch (err) {
                console.error("Failed to delete directory '" + path + "'");
            }
        }
    }
};
exports.tryDeleteFileTimes = function (path, retries, times) {
    if (retries === void 0) { retries = 3; }
    if (times === void 0) { times = 1; }
    if (!exports.tryDeleteFile(path)) {
        if (retries <= times) {
            ThreadingHelper_1.sleep(1000);
            exports.tryDeleteFileTimes(path, retries, times + 1);
        }
        else {
            console.error("Failed to delete file '" + path + "'");
        }
    }
};
exports.tryDeleteFile = function (path) {
    if (!fs.existsSync(path)) {
        return true;
    }
    try {
        fs.unlinkSync(path);
        return true;
    }
    catch (err) {
        return false;
    }
};
exports.mkdir = function () {
    var directories = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        directories[_i] = arguments[_i];
    }
    for (var _a = 0, directories_1 = directories; _a < directories_1.length; _a++) {
        var dir = directories_1[_a];
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
    }
};
