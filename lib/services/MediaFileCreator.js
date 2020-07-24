"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.MediaFileCreator = exports.WithSegmentListsCreator = exports.WithSegmentFilesCreator = exports.WithRootCreator = void 0;
var path = __importStar(require("path"));
var fs = __importStar(require("fs"));
var FileHelper_1 = require("../helpers/FileHelper");
var FFmpegProcess_1 = require("./FFmpegProcess");
var UniqueHelper_1 = require("../helpers/UniqueHelper");
var TypeHelper_1 = require("../helpers/TypeHelper");
var WithRootCreator = /** @class */ (function () {
    function WithRootCreator(root) {
        this.root = root;
    }
    return WithRootCreator;
}());
exports.WithRootCreator = WithRootCreator;
var WithSegmentFilesCreator = /** @class */ (function () {
    function WithSegmentFilesCreator(segmentFiles) {
        this.segmentFiles = segmentFiles;
    }
    return WithSegmentFilesCreator;
}());
exports.WithSegmentFilesCreator = WithSegmentFilesCreator;
var WithSegmentListsCreator = /** @class */ (function () {
    function WithSegmentListsCreator(segmentLists) {
        this.segmentLists = segmentLists;
    }
    return WithSegmentListsCreator;
}());
exports.WithSegmentListsCreator = WithSegmentListsCreator;
var MediaFileCreator = /** @class */ (function () {
    function MediaFileCreator(cwd) {
        if (cwd === void 0) { cwd = __dirname; }
        this.cwd = cwd;
    }
    MediaFileCreator.prototype.create = function (outfile, options) {
        return __awaiter(this, void 0, void 0, function () {
            var opt, creator, segmentListFiles, segmentFiles, segmentList, mergedSegmentListFile, concatenatedFile;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        opt = __assign({ cwd: this.cwd, creator: new WithRootCreator(this.cwd) }, options);
                        creator = opt.creator;
                        if (!TypeHelper_1.ofType(creator, WithRootCreator)) return [3 /*break*/, 1];
                        segmentListFiles = this.findSegmentLists(creator.root);
                        if (segmentListFiles.length > 0) {
                            return [2 /*return*/, this.create(outfile, __assign(__assign({}, opt), { creator: new WithSegmentListsCreator(segmentListFiles) }))];
                        }
                        segmentFiles = this.findSegmentFiles(creator.root);
                        if (segmentFiles.length > 0) {
                            return [2 /*return*/, this.create(outfile, __assign(__assign({}, opt), { creator: new WithSegmentFilesCreator(segmentFiles) }))];
                        }
                        return [2 /*return*/, undefined];
                    case 1:
                        if (!TypeHelper_1.ofType(creator, WithSegmentFilesCreator)) return [3 /*break*/, 2];
                        if (creator.segmentFiles.length === 1) {
                            return [2 /*return*/, this.convert(creator.segmentFiles[0], outfile)];
                        }
                        segmentList = this.createSegmentList(creator.segmentFiles);
                        return [2 /*return*/, this.create(outfile, __assign(__assign({}, opt), { creator: new WithSegmentListsCreator([segmentList]) }))];
                    case 2:
                        if (!TypeHelper_1.ofType(creator, WithSegmentListsCreator)) return [3 /*break*/, 4];
                        mergedSegmentListFile = void 0;
                        if (creator.segmentLists.length === 1) {
                            mergedSegmentListFile = creator.segmentLists[0];
                        }
                        else if (creator.segmentLists.length > 1) {
                            mergedSegmentListFile = this.mergeSegmentFiles(this.cwd, creator.segmentLists);
                        }
                        else {
                            return [2 /*return*/, undefined];
                        }
                        return [4 /*yield*/, this.concat(mergedSegmentListFile)];
                    case 3:
                        concatenatedFile = _a.sent();
                        return [2 /*return*/, this.convert(concatenatedFile, outfile)];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    MediaFileCreator.prototype.concat = function (mergedSegmentListFile) {
        return __awaiter(this, void 0, void 0, function () {
            var unique, filename;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        unique = UniqueHelper_1.createUnique();
                        filename = "all_" + unique + ".ts";
                        return [4 /*yield*/, new FFmpegProcess_1.FFmpegProcess().startAsync(['-f', 'concat', '-i', mergedSegmentListFile, '-c', 'copy', filename], {
                                cwd: this.cwd,
                            })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, filename];
                }
            });
        });
    };
    MediaFileCreator.prototype.convert = function (inputFile, outfile) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('Convert', {
                            tsfile: inputFile,
                            outfile: outfile,
                        });
                        return [4 /*yield*/, new FFmpegProcess_1.FFmpegProcess().startAsync(['-i', inputFile, '-acodec', 'copy', '-vcodec', 'copy', outfile], {
                                cwd: this.cwd,
                            })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, outfile];
                }
            });
        });
    };
    MediaFileCreator.prototype.findSegmentFiles = function (directory, pattern) {
        var pttrn = pattern ? pattern : new RegExp("seg_\\d*_\\d*_\\d*\\.ts");
        return FileHelper_1.findFiles(directory, pttrn);
    };
    MediaFileCreator.prototype.findSegmentLists = function (directory, pattern) {
        var pttrn = pattern ? pattern : new RegExp("seglist_\\d*_\\d*\\.txt");
        return FileHelper_1.findFiles(directory, pttrn);
    };
    MediaFileCreator.prototype.mergeSegmentFiles = function (directory, files) {
        var unique = UniqueHelper_1.createUnique();
        var mergedOutFile = path.join(directory, "seglist_" + unique + "_merged.txt");
        FileHelper_1.mergeFiles(files, mergedOutFile);
        return mergedOutFile;
    };
    MediaFileCreator.prototype.createSegmentList = function (segmentFiles) {
        var unique = UniqueHelper_1.createUnique();
        var segmentListFile = "seglist_" + unique + ".txt";
        var writer = fs.createWriteStream(path.join(this.cwd, segmentListFile), {
            flags: 'a',
        });
        segmentFiles.forEach(function (f) { return writer.write("file " + path.basename(f) + "\n"); });
        writer.close();
        return segmentListFile;
    };
    return MediaFileCreator;
}());
exports.MediaFileCreator = MediaFileCreator;
