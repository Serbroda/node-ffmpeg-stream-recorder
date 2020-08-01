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
exports.StreamRecorder = void 0;
var log4js_api_1 = require("@log4js-node/log4js-api");
var fs = __importStar(require("fs"));
var path = __importStar(require("path"));
var FileHelper_1 = require("../helpers/FileHelper");
var UniqueHelper_1 = require("../helpers/UniqueHelper");
var RecorderState_1 = require("../models/RecorderState");
var FFmpegProcess_1 = require("./FFmpegProcess");
var GenericEvent_1 = require("../helpers/GenericEvent");
var MediaFileCreator_1 = require("./MediaFileCreator");
var logger = log4js_api_1.getLogger('ffmpeg-stream-recorder');
var StreamRecorder = /** @class */ (function () {
    function StreamRecorder(param1, options) {
        this._onStartEvent = new GenericEvent_1.GenericEvent();
        this._onStopEvent = new GenericEvent_1.GenericEvent();
        this._onCompleteEvent = new GenericEvent_1.GenericEvent();
        this._onStateChangeEvent = new GenericEvent_1.GenericEvent();
        this._onSegmentFileAddEvent = new GenericEvent_1.GenericEvent();
        this._recorderProcess = new FFmpegProcess_1.FFmpegProcess();
        this._fileWatcher = null;
        if (typeof param1 !== 'string') {
            this._id = param1.id;
            this._name = param1.name;
            this._url = param1.url;
            this._options = param1.options;
            this._sessionInfo = param1.sessionInfo;
        }
        else {
            this._id = UniqueHelper_1.createUnique();
            this._name = this._id;
            this._url = param1;
            this._options = __assign({
                workDir: __dirname,
                clean: true,
                retry: 0,
                createOnExit: true,
            }, options);
            this._sessionInfo = {
                state: this._options.cwd && fs.existsSync(this._options.cwd)
                    ? RecorderState_1.RecorderState.STOPPED
                    : RecorderState_1.RecorderState.INITIAL,
                sessionUnique: UniqueHelper_1.createUnique(),
                retries: 0,
            };
        }
        if (options === null || options === void 0 ? void 0 : options.onStateChange) {
            this.onStateChange.on(options.onStateChange);
        }
    }
    Object.defineProperty(StreamRecorder.prototype, "onStart", {
        get: function () {
            return this._onStartEvent.expose();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(StreamRecorder.prototype, "onStop", {
        get: function () {
            return this._onStopEvent.expose();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(StreamRecorder.prototype, "onComplete", {
        get: function () {
            return this._onCompleteEvent.expose();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(StreamRecorder.prototype, "onStateChange", {
        get: function () {
            return this._onStateChangeEvent.expose();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(StreamRecorder.prototype, "onSegmentFileAdd", {
        get: function () {
            return this._onSegmentFileAddEvent.expose();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(StreamRecorder.prototype, "id", {
        /**
         * Unique recorder id e.g 19112814560452.
         */
        get: function () {
            return this._id;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(StreamRecorder.prototype, "name", {
        get: function () {
            return this._name;
        },
        set: function (val) {
            this._name = val;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(StreamRecorder.prototype, "options", {
        /**
         * The options for the recorder.
         */
        get: function () {
            return this._options;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(StreamRecorder.prototype, "sessionInfo", {
        /**
         * Informations about the current session.
         */
        get: function () {
            return this._sessionInfo;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(StreamRecorder.prototype, "state", {
        /**
         * Gets the current recorder state.
         */
        get: function () {
            return this._sessionInfo.state;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(StreamRecorder.prototype, "url", {
        /**
         * The URL to be recorded.
         */
        get: function () {
            return this._url;
        },
        /**
         * Sets the URL to record.
         * @param url Stream URL
         */
        set: function (url) {
            this._url = url;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(StreamRecorder.prototype, "outFile", {
        /**
         * Gets the defined output file.
         */
        get: function () {
            return this._options.outfile;
        },
        /**
         * Sets the output file.
         * @param outFile Outfile
         */
        set: function (outFile) {
            this._options.outfile = outFile;
        },
        enumerable: false,
        configurable: true
    });
    StreamRecorder.prototype.setState = function (state) {
        logger.debug("State changed: " + this._sessionInfo.state + " -> " + state);
        if (state === RecorderState_1.RecorderState.RECORDING) {
            this._onStartEvent.trigger(this.sessionInfo);
        }
        if (state === RecorderState_1.RecorderState.SUCCESS) {
            this._onCompleteEvent.trigger();
        }
        if (state === RecorderState_1.RecorderState.EXITED_ABNORMALLY) {
            this._onStopEvent.trigger();
        }
        this._onStateChangeEvent.trigger({
            newState: state,
            oldState: this._sessionInfo.state,
            sessionInfo: this.sessionInfo,
        });
        this.sessionInfo.state = state;
    };
    /**
     * Gets true if recorder is currently busy or false if not.
     * @returns Busy true/false
     */
    StreamRecorder.prototype.isBusy = function () {
        return (this._recorderProcess.isRunning() ||
            [RecorderState_1.RecorderState.RECORDING, RecorderState_1.RecorderState.FINISHING].includes(this._sessionInfo.state));
    };
    /**
     * Starts the recording.
     */
    StreamRecorder.prototype.start = function () {
        var _this = this;
        if (this._recorderProcess.isRunning()) {
            logger.warn('Process cannot be started because one is already running');
            return;
        }
        logger.debug('Starting recording');
        if (!this._options.cwd) {
            this._options.cwd = path.join(this._options.workDir, this._id);
        }
        FileHelper_1.mkdir(this._options.workDir, this._options.cwd);
        this._sessionInfo.sessionUnique = UniqueHelper_1.createUnique();
        this.setState(RecorderState_1.RecorderState.RECORDING);
        this._fileWatcher = fs.watch(this._options.cwd, function (eventType, filename) {
            if (eventType === 'rename' &&
                FileHelper_1.filenameMatchesPattern(filename, new RegExp("seg_" + _this._id + "_\\d*_\\d*\\.ts"))) {
                _this._onSegmentFileAddEvent.trigger(filename);
            }
        });
        this._recorderProcess.start([
            '-y',
            '-i',
            this._url,
            '-c:v',
            'copy',
            '-c:a',
            'copy',
            '-f',
            'segment',
            '-segment_list',
            "seglist_" + this._id + "_" + this._sessionInfo.sessionUnique + ".txt",
            '-segment_list_entry_prefix',
            'file ',
            "seg_" + this._id + "_" + this._sessionInfo.sessionUnique + "_%05d.ts",
        ], {
            cwd: this._options.cwd,
            onExit: function (result) {
                if (_this._fileWatcher) {
                    _this._fileWatcher.close();
                }
                if (result.plannedKill && _this._sessionInfo.state !== RecorderState_1.RecorderState.FINISHING) {
                    _this.setState(RecorderState_1.RecorderState.STOPPED);
                }
                else if (_this._options.retry > 0 && _this._sessionInfo.retries < _this._options.retry) {
                    _this._sessionInfo.retries++;
                    logger.debug("Process exited abnormally. Retry recording: " + _this._sessionInfo.retries + "/" + _this._options.retry);
                    setTimeout(function () {
                        _this.start();
                    }, 5000);
                }
                else if (_this._options.createOnExit) {
                    logger.debug("Automatically creating output file because process exited abnormally");
                    setTimeout(function () {
                        _this.finish();
                    }, 1000);
                }
                else {
                    _this.setState(RecorderState_1.RecorderState.EXITED_ABNORMALLY);
                }
            },
        });
    };
    StreamRecorder.prototype.pause = function () {
        this.stop(false);
    };
    /**
     * Stops the recording and creats the output file.
     */
    StreamRecorder.prototype.stop = function (finish) {
        var _this = this;
        if (finish === void 0) { finish = true; }
        if (this._sessionInfo.state === RecorderState_1.RecorderState.SUCCESS) {
            return;
        }
        if (finish) {
            this._recorderProcess.killAsync(5000).then(function () {
                _this.finish();
            });
        }
        else {
            this._recorderProcess.kill();
        }
    };
    /**
     * Discards the currently recordered files
     */
    StreamRecorder.prototype.discard = function () {
        var _this = this;
        this._recorderProcess.killAsync(5000).then(function () {
            _this.cleanWorkingDirectory();
        });
    };
    /**
     * Creates the target output file from currently recorded segments
     * @param outfile Target media file
     */
    StreamRecorder.prototype.finish = function (outfile) {
        var _this = this;
        if (this._sessionInfo.state === RecorderState_1.RecorderState.SUCCESS) {
            return;
        }
        this.setState(RecorderState_1.RecorderState.FINISHING);
        this.outFile = outfile
            ? outfile
            : this._options.outfile
                ? this._options.outfile
                : path.join(this.options.workDir, "out_" + this._id + "-" + UniqueHelper_1.createIsoDateTime() + ".mp4");
        if (!this.outFile) {
            logger.error('Cannot finish recording because no output file is specified');
            this.setState(RecorderState_1.RecorderState.ERROR);
            return;
        }
        logger.debug('Finishing recording');
        FileHelper_1.mkdir(path.dirname(this.outFile));
        this.createOutputFile(this.outFile).then(function () {
            _this.cleanWorkingDirectory();
            _this.setState(RecorderState_1.RecorderState.SUCCESS);
        });
    };
    StreamRecorder.prototype.createOutputFile = function (outfile) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                        var file_1, err_1;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    logger.debug('Creating output file...');
                                    return [4 /*yield*/, new MediaFileCreator_1.MediaFileCreator(this._options.cwd).create(outfile)];
                                case 1:
                                    file_1 = _a.sent();
                                    setTimeout(function () { return resolve(file_1); }, 1000);
                                    return [3 /*break*/, 3];
                                case 2:
                                    err_1 = _a.sent();
                                    reject(err_1);
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); })];
            });
        });
    };
    StreamRecorder.prototype.cleanWorkingDirectory = function () {
        var _this = this;
        if (!this._options.clean || !this._options.cwd || !fs.existsSync(this._options.cwd)) {
            return;
        }
        logger.debug('Cleaning working directory ' + this._options.cwd);
        setTimeout(function () {
            FileHelper_1.deleteFolderRecursive(_this._options.cwd, false);
        }, 1000);
    };
    StreamRecorder.prototype.toJson = function () {
        return {
            id: this._id,
            url: this._url,
            name: this._name,
            options: this._options,
            sessionInfo: this._sessionInfo,
        };
    };
    return StreamRecorder;
}());
exports.StreamRecorder = StreamRecorder;
