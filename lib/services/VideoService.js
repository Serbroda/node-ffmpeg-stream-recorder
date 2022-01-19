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
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
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
exports.VideoService = void 0;
var FFprobeProcess_1 = require("./FFprobeProcess");
var path = __importStar(require("path"));
var fs = __importStar(require("fs"));
var FFmpegProcess_1 = require("./FFmpegProcess");
var timeStamp = /^[0-9]{2}:[0-9]{2}:[0-9]{2}.[0-9]{0,3}$/;
var VideoService = /** @class */ (function () {
    function VideoService() {
    }
    VideoService.prototype.getMetadata = function (file, options) {
        return __awaiter(this, void 0, void 0, function () {
            var fileStats, ext, filename, duration;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        fileStats = fs.statSync(file);
                        ext = path.extname(file);
                        filename = path.basename(file, ext);
                        return [4 /*yield*/, this.getDuration(file, options)];
                    case 1:
                        duration = _a.sent();
                        return [2 /*return*/, {
                                name: filename,
                                path: file,
                                duration: duration,
                                size: fileStats.size,
                                created: fileStats.mtime,
                                type: ext,
                            }];
                }
            });
        });
    };
    VideoService.prototype.getDuration = function (file, options) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, new FFprobeProcess_1.FFprobeProcess().exec(['-i', file, '-show_entries', 'format=duration', '-v', 'quiet', '-of', 'csv=p=0'], options)];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, +result];
                }
            });
        });
    };
    VideoService.prototype.createThumbnail = function (filename, options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        var extension = path.extname(filename);
                        var name = path.basename(filename, extension);
                        var opt = __assign({
                            outfile: path.join(path.dirname(filename), name + ".jpg"),
                            resolution: '640x360',
                            offsetSeconds: 2,
                            override: false,
                        }, options);
                        if (fs.existsSync(opt.outfile)) {
                            if (opt.override) {
                                fs.rmSync(opt.outfile);
                            }
                            else {
                                throw new Error("Thumbnail already exists");
                            }
                        }
                        var prc = new FFmpegProcess_1.FFmpegProcess();
                        prc.onExit.once(function (result) {
                            resolve(opt.outfile);
                        });
                        prc.start([
                            '-itsoffset',
                            "-" + opt.offsetSeconds,
                            '-i',
                            filename,
                            '-vcodec',
                            'mjpeg',
                            '-vframes',
                            '1',
                            '-an',
                            '-f',
                            'rawvideo',
                            '-s',
                            opt.resolution,
                            opt.outfile,
                        ]);
                    })];
            });
        });
    };
    /*
    https://superuser.com/questions/138331/using-ffmpeg-to-cut-up-video
    The following would clip the first 30 seconds, and then clip everything that is 10 seconds after that:
        ffmpeg -ss 00:00:30.0 -i input.wmv -c copy -t 00:00:10.0 output.wmv
        ffmpeg -ss 30 -i input.wmv -c copy -t 10 output.wmv
     */
    VideoService.prototype.cutVideo = function (input, outfile, cutRange, options) {
        if (options === void 0) { options = { override: false }; }
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                if (Array.isArray(cutRange)) {
                    return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                            var cutParts, i, range, dir, ext, name_1, tmpFile, part, _i, cutParts_1, part, err_1;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        cutParts = [];
                                        _a.label = 1;
                                    case 1:
                                        _a.trys.push([1, 7, , 8]);
                                        i = 0;
                                        _a.label = 2;
                                    case 2:
                                        if (!(i < cutRange.length)) return [3 /*break*/, 5];
                                        range = cutRange[i];
                                        dir = path.dirname(outfile);
                                        ext = path.extname(outfile);
                                        name_1 = path.basename(outfile, ext);
                                        tmpFile = path.join(dir, name_1 + "_" + i + ext);
                                        return [4 /*yield*/, this.cutVideo(input, tmpFile, range, { override: true })];
                                    case 3:
                                        part = _a.sent();
                                        cutParts.push(part);
                                        _a.label = 4;
                                    case 4:
                                        i++;
                                        return [3 /*break*/, 2];
                                    case 5: return [4 /*yield*/, this.combineVideos(outfile, cutParts)];
                                    case 6:
                                        _a.sent();
                                        for (_i = 0, cutParts_1 = cutParts; _i < cutParts_1.length; _i++) {
                                            part = cutParts_1[_i];
                                            if (fs.existsSync(part)) {
                                                fs.rmSync(part);
                                            }
                                        }
                                        resolve(outfile);
                                        return [3 /*break*/, 8];
                                    case 7:
                                        err_1 = _a.sent();
                                        reject(err_1);
                                        return [3 /*break*/, 8];
                                    case 8: return [2 /*return*/];
                                }
                            });
                        }); })];
                }
                else {
                    return [2 /*return*/, new Promise(function (resolve, reject) {
                            if (!fs.existsSync(input)) {
                                throw new Error("File '" + input + "' not found");
                            }
                            if (fs.existsSync(outfile)) {
                                if (options.override) {
                                    fs.rmSync(outfile);
                                }
                                else {
                                    throw new Error("Output file '" + input + "' already outfile");
                                }
                            }
                            var start = typeof cutRange.start === 'number' ? "" + cutRange.start : cutRange.start + ".0";
                            var duration = typeof cutRange.duration === 'number' ? "" + cutRange.duration : cutRange.duration + ".0";
                            console.log('Creating file', outfile);
                            var prc = new FFmpegProcess_1.FFmpegProcess();
                            prc.onExit.once(function (result) {
                                resolve(outfile);
                            });
                            prc.start(['-ss', start, '-i', input, '-c', 'copy', '-t', duration, outfile]);
                        })];
                }
                return [2 /*return*/];
            });
        });
    };
    /*
        https://stackoverflow.com/questions/7333232/how-to-concatenate-two-mp4-files-using-ffmpeg
        (echo file 'first file.mp4' & echo file 'second file.mp4' )>list.txt
        ffmpeg -safe 0 -f concat -i list.txt -c copy output.mp4
    */
    VideoService.prototype.combineVideos = function (outfile, videos) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        if (videos.length < 1) {
                            reject('Videos should be greater than 0');
                        }
                        else {
                            var txt_1 = outfile + ".txt";
                            if (fs.existsSync(txt_1)) {
                                fs.rmSync(txt_1);
                            }
                            for (var _i = 0, videos_1 = videos; _i < videos_1.length; _i++) {
                                var video = videos_1[_i];
                                fs.appendFileSync(txt_1, "file '" + video + "'\n");
                            }
                            var prc = new FFmpegProcess_1.FFmpegProcess();
                            prc.onExit.once(function (result) {
                                setTimeout(function () {
                                    if (fs.existsSync(txt_1)) {
                                        fs.rmSync(txt_1);
                                    }
                                }, 200);
                                resolve(outfile);
                            });
                            prc.start(['-safe', '0', "-f", 'concat', '-i', txt_1, '-c', 'copy', outfile]);
                        }
                    })];
            });
        });
    };
    return VideoService;
}());
exports.VideoService = VideoService;
