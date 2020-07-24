"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaFileCreator = exports.MediaFileCreationWithSegmentListFiles = exports.MediaFileCreationWithSegmentFiles = exports.MediaFileCreationWithRoot = void 0;
var FileHelper_1 = require("../helpers/FileHelper");
var FFmpegProcess_1 = require("./FFmpegProcess");
var UniqueHelper_1 = require("../helpers/UniqueHelper");
var path_1 = require("path");
var MediaFileCreationWithRoot = /** @class */ (function () {
    function MediaFileCreationWithRoot(outfile, root) {
        this.outfile = outfile;
        this.root = root;
    }
    return MediaFileCreationWithRoot;
}());
exports.MediaFileCreationWithRoot = MediaFileCreationWithRoot;
var MediaFileCreationWithSegmentFiles = /** @class */ (function () {
    function MediaFileCreationWithSegmentFiles(outfile, segmentFiles) {
        this.outfile = outfile;
        this.segmentFiles = segmentFiles;
    }
    return MediaFileCreationWithSegmentFiles;
}());
exports.MediaFileCreationWithSegmentFiles = MediaFileCreationWithSegmentFiles;
var MediaFileCreationWithSegmentListFiles = /** @class */ (function () {
    function MediaFileCreationWithSegmentListFiles(outfile, segmentListFiles) {
        this.outfile = outfile;
        this.segmentListFiles = segmentListFiles;
    }
    return MediaFileCreationWithSegmentListFiles;
}());
exports.MediaFileCreationWithSegmentListFiles = MediaFileCreationWithSegmentListFiles;
var MediaFileCreator = /** @class */ (function () {
    function MediaFileCreator(root) {
        this.root = root;
    }
    MediaFileCreator.prototype.create = function (outfile, segments) {
        return __awaiter(this, void 0, void 0, function () {
            var files, concat;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        files = segments ? segments : this.getSegmentFiles();
                        console.log('Create', files);
                        if (!(files.length === 0)) return [3 /*break*/, 1];
                        return [2 /*return*/, undefined];
                    case 1:
                        if (!(files.length === 1)) return [3 /*break*/, 2];
                        return [2 /*return*/, this.convert(files[0], outfile)];
                    case 2: return [4 /*yield*/, this.concat()];
                    case 3:
                        concat = _a.sent();
                        return [2 /*return*/, this.convert(concat, outfile)];
                }
            });
        });
    };
    MediaFileCreator.prototype.concat = function (segmentLists) {
        return __awaiter(this, void 0, void 0, function () {
            var files, fullSegmentListFile, unique, filename;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        files = segmentLists ? segmentLists : this.getSegmentListFiles();
                        fullSegmentListFile = files.length > 1 ? this.mergeSegmentFiles(files) : files[0];
                        unique = UniqueHelper_1.createUnique();
                        filename = "all_" + unique + ".ts";
                        console.log('Concat', {
                            files: files,
                            fullSegmentListFile: fullSegmentListFile,
                        });
                        return [4 /*yield*/, new FFmpegProcess_1.FFmpegProcess().startAsync(['-f', 'concat', '-i', fullSegmentListFile, '-c', 'copy', filename], {
                                cwd: this.root,
                            })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, filename];
                }
            });
        });
    };
    MediaFileCreator.prototype.convert = function (tsfile, outfile) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('Convert', {
                            tsfile: tsfile,
                            outfile: outfile,
                        });
                        return [4 /*yield*/, new FFmpegProcess_1.FFmpegProcess().startAsync(['-i', tsfile, '-acodec', 'copy', '-vcodec', 'copy', outfile], {
                                cwd: this.root,
                            })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, outfile];
                }
            });
        });
    };
    MediaFileCreator.prototype.getSegmentFiles = function (directory, pattern) {
        var dir = directory ? directory : this.root;
        var pttrn = pattern ? pattern : new RegExp("seg_\\d*_\\d*_\\d*\\.ts");
        return FileHelper_1.findFiles(dir, pttrn);
    };
    MediaFileCreator.prototype.getSegmentListFiles = function (directory, pattern) {
        var dir = directory ? directory : this.root;
        var pttrn = pattern ? pattern : new RegExp("seglist_\\d*_\\d*\\.txt");
        return FileHelper_1.findFiles(dir, pttrn);
    };
    MediaFileCreator.prototype.mergeSegmentFiles = function (files) {
        var unique = UniqueHelper_1.createUnique();
        var mergedOutFile = path_1.join(this.root, "seglist_" + unique + "_merged.txt");
        FileHelper_1.mergeFiles(files, mergedOutFile);
        return mergedOutFile;
    };
    return MediaFileCreator;
}());
exports.MediaFileCreator = MediaFileCreator;
