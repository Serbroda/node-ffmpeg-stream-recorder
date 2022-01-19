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
//export type TimeStamp = `${number}${number}:${number}${number}:${number}${number}`;
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
    VideoService.prototype.cutVideo = function (input, start, duration, outfile, options) {
        if (options === void 0) { options = { override: false }; }
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        if (!fs.existsSync(input)) {
                            throw new Error("File '" + input + "' not found");
                        }
                        if (fs.existsSync(outfile)) {
                            if (outfile) {
                                fs.rmSync(outfile);
                            }
                            else {
                                throw new Error("Output file '" + input + "' already outfile");
                            }
                        }
                        var startParam = typeof start === 'number' ? "" + start : start + ".0";
                        var durationParam = typeof duration === 'number' ? "" + duration : duration + ".0";
                        var prc = new FFmpegProcess_1.FFmpegProcess();
                        prc.onExit.once(function (result) {
                            resolve(outfile);
                        });
                        prc.start(['-ss', startParam, '-i', input, '-c', 'copy', '-t', durationParam, outfile]);
                    })];
            });
        });
    };
    return VideoService;
}());
exports.VideoService = VideoService;
