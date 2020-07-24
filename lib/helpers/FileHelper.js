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
exports.deleteFolderRecursive = exports.mergeFiles = exports.filenameMatchesPattern = exports.findFiles = void 0;
var path_1 = require("path");
var fs = __importStar(require("fs"));
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
                fs.unlinkSync(curPath);
            }
        });
        if (filesOnly !== undefined && !filesOnly) {
            fs.rmdirSync(path);
        }
    }
};
