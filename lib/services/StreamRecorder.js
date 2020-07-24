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
exports.StreamRecorder = exports.defaultOptions = void 0;
var log4js_api_1 = require("@log4js-node/log4js-api");
var fs = __importStar(require("fs"));
var path_1 = require("path");
var FileHelper_1 = require("../helpers/FileHelper");
var UniqueHelper_1 = require("../helpers/UniqueHelper");
var RecorderState_1 = require("../models/RecorderState");
var FFmpegProcess_1 = require("./FFmpegProcess");
var GenericEvent_1 = require("../helpers/GenericEvent");
var MediaFileCreator_1 = require("./MediaFileCreator");
var logger = log4js_api_1.getLogger('ffmpeg-stream-recorder');
exports.defaultOptions = {
    workingDirectory: __dirname,
    cleanSegmentFiles: true,
    ensureDirectoryExists: true,
    retryTimesIfRecordingExitedAbnormally: 0,
    automaticallyCreateOutfileIfExitedAbnormally: true,
    debug: false,
};
var StreamRecorder = /** @class */ (function () {
    function StreamRecorder(url, options) {
        this._onStartEvent = new GenericEvent_1.GenericEvent();
        this._onCompleteEvent = new GenericEvent_1.GenericEvent();
        this._onStateChangeEvent = new GenericEvent_1.GenericEvent();
        this._onSegmentFileAddEvent = new GenericEvent_1.GenericEvent();
        this._fileWatcher = null;
        this._id = UniqueHelper_1.createUnique();
        this._url = url;
        this._options = __assign({
            workingDirectory: __dirname,
            cleanSegmentFiles: true,
            ensureDirectoryExists: true,
            retryTimesIfRecordingExitedAbnormally: 0,
            automaticallyCreateOutfileIfExitedAbnormally: true,
            debug: false,
        }, options);
        this._process = new FFmpegProcess_1.FFmpegProcess();
        this._sessionInfo = {
            recorderId: this._id,
            sessionUnique: this._id,
            state: RecorderState_1.RecorderState.INITIAL,
            startCounter: 0,
            retries: 0,
        };
        if (options === null || options === void 0 ? void 0 : options.onStart) {
            this.onStart.on(options.onStart);
        }
        if (options === null || options === void 0 ? void 0 : options.onComplete) {
            this.onComplete.on(options.onComplete);
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
        if (state == RecorderState_1.RecorderState.RECORDING) {
            this._onStartEvent.trigger(this.sessionInfo);
        }
        if (state == RecorderState_1.RecorderState.COMPLETED) {
            this._onCompleteEvent.trigger();
        }
        if (state == RecorderState_1.RecorderState.COMPLETED && this._completed) {
            this._completed();
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
        return (this._process.isRunning() ||
            [
                RecorderState_1.RecorderState.RECORDING,
                RecorderState_1.RecorderState.STOPPING,
                RecorderState_1.RecorderState.CREATINGOUTFILE,
                RecorderState_1.RecorderState.CLEANING,
            ].includes(this._sessionInfo.state));
    };
    /**
     * Gets a list of segment list files for the current
     * session which are used to create the output file.
     * @returns List of segment list files
     */
    StreamRecorder.prototype.getSessionSegmentLists = function () {
        if (!this._currentWorkingDirectory) {
            return [];
        }
        return FileHelper_1.findFiles(this._currentWorkingDirectory, new RegExp("seglist_" + this._sessionInfo.sessionUnique + "_\\d*\\.txt"));
    };
    /**
     * Gets a list of segment files for the current session.
     * @return List of segment files
     */
    StreamRecorder.prototype.getSessionSegmentFiles = function () {
        if (!this._currentWorkingDirectory) {
            return [];
        }
        return FileHelper_1.findFiles(this._currentWorkingDirectory, new RegExp("seg_" + this._sessionInfo.sessionUnique + "_\\d*_\\d*\\.ts"));
    };
    /**
     * Starts the recording.
     */
    StreamRecorder.prototype.start = function () {
        if (this._process.isRunning()) {
            logger.warn('Process cannot be started because one is already running');
            return;
        }
        logger.debug('Starting recording');
        if (this._options.ensureDirectoryExists &&
            this._options.workingDirectory &&
            !fs.existsSync(this._options.workingDirectory)) {
            fs.mkdirSync(this._options.workingDirectory);
        }
        if (this._sessionInfo.state != RecorderState_1.RecorderState.PAUSED) {
            this.startNewSession();
        }
        this._sessionInfo.startCounter = this._sessionInfo.startCounter + 1;
        this.recordForSession();
    };
    /**
     * Pauses the recording.
     */
    StreamRecorder.prototype.pause = function () {
        this.setState(RecorderState_1.RecorderState.PAUSED);
        this.killProcess();
    };
    /**
     * Stops the recording and creats the output file.
     */
    StreamRecorder.prototype.stop = function (outfile, onComplete) {
        if (this._sessionInfo.state === RecorderState_1.RecorderState.COMPLETED) {
            return;
        }
        if (outfile) {
            this.outFile = outfile;
        }
        if (!this.outFile) {
            this.outFile = path_1.join(this.options.workingDirectory, this.sessionInfo.sessionUnique + '.mp4');
        }
        this._completed = onComplete;
        this.setState(RecorderState_1.RecorderState.STOPPING);
        this.killProcess();
    };
    /**
     * Kills the current process. Alias for pause()
     */
    StreamRecorder.prototype.kill = function () {
        this.pause();
    };
    StreamRecorder.prototype.startNewSession = function () {
        this._process = new FFmpegProcess_1.FFmpegProcess();
        logger.debug('Creating new session');
        this._sessionInfo.sessionUnique = UniqueHelper_1.createUnique();
        var workDir = this._options.workingDirectory ? this._options.workingDirectory : __dirname;
        if (!fs.existsSync(workDir)) {
            this.setState(RecorderState_1.RecorderState.ERROR);
            throw new Error("Working directory '" + workDir + "' does not exist!");
        }
        this._currentWorkingDirectory = path_1.join(workDir, this._sessionInfo.sessionUnique);
        this._sessionInfo.cwd = this._currentWorkingDirectory;
        if (!fs.existsSync(this._currentWorkingDirectory)) {
            fs.mkdirSync(this._currentWorkingDirectory);
        }
    };
    StreamRecorder.prototype.finish = function () {
        var _this = this;
        if (!this.outFile) {
            logger.error('Cannot finish recording because no output file is specified');
            this.setState(RecorderState_1.RecorderState.ERROR);
            return;
        }
        if (this._fileWatcher) {
            this._fileWatcher.close();
        }
        logger.debug('Finishing recording');
        var dir = path_1.dirname(this.outFile);
        if (this._options.ensureDirectoryExists && !fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        this.createOutputFile(this.outFile).then(function () {
            _this.cleanWorkingDirectory();
            _this.setState(RecorderState_1.RecorderState.COMPLETED);
        });
    };
    StreamRecorder.prototype.killProcess = function () {
        this._process.kill();
    };
    StreamRecorder.prototype.recordForSession = function () {
        var _this = this;
        this.setState(RecorderState_1.RecorderState.RECORDING);
        this._fileWatcher = fs.watch(this._currentWorkingDirectory, function (eventType, filename) {
            if (eventType === 'rename' &&
                FileHelper_1.filenameMatchesPattern(filename, new RegExp("seg_" + _this._sessionInfo.sessionUnique + "_\\d*_\\d*\\.ts"))) {
                _this._onSegmentFileAddEvent.trigger(filename);
            }
        });
        this._process.start([
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
            "seglist_" + this._sessionInfo.sessionUnique + "_" + this._sessionInfo.startCounter
                .toString()
                .padStart(2, '0') + ".txt",
            '-segment_list_entry_prefix',
            'file ',
            "seg_" + this._sessionInfo.sessionUnique + "_" + this._sessionInfo.startCounter
                .toString()
                .padStart(2, '0') + "_%05d.ts",
        ], {
            cwd: this._currentWorkingDirectory,
            onExit: function (result) {
                if (!result.plannedKill) {
                    _this.setState(RecorderState_1.RecorderState.PROCESS_EXITED_ABNORMALLY);
                    if (_this._options.retryTimesIfRecordingExitedAbnormally &&
                        _this._options.retryTimesIfRecordingExitedAbnormally > 0 &&
                        _this._sessionInfo.retries < _this._options.retryTimesIfRecordingExitedAbnormally) {
                        _this._sessionInfo.retries = _this._sessionInfo.retries + 1;
                        logger.debug("Process exited abnormally. Retry recording: " + _this._sessionInfo.retries + "/" + _this._options.retryTimesIfRecordingExitedAbnormally);
                        setTimeout(function () {
                            _this.recordForSession();
                        }, 1000);
                    }
                    else if (_this._options.automaticallyCreateOutfileIfExitedAbnormally) {
                        logger.debug("Automatically creating output file because process exited abnormally");
                        setTimeout(function () {
                            _this.finish();
                        }, 1000);
                    }
                }
                else if (_this._sessionInfo.state !== RecorderState_1.RecorderState.PAUSED) {
                    setTimeout(function () {
                        _this.finish();
                    }, 1000);
                }
            },
        });
    };
    StreamRecorder.prototype.createOutputFile = function (outfile) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, new MediaFileCreator_1.MediaFileCreator(this._currentWorkingDirectory).create(outfile)];
            });
        });
    };
    StreamRecorder.prototype.cleanWorkingDirectory = function () {
        var _this = this;
        if (!this._options.cleanSegmentFiles ||
            !this._currentWorkingDirectory ||
            !fs.existsSync(this._currentWorkingDirectory)) {
            return;
        }
        logger.debug('Cleaning working directory ' + this._currentWorkingDirectory);
        setTimeout(function () {
            FileHelper_1.deleteFolderRecursive(_this._currentWorkingDirectory, false);
        }, 1000);
    };
    return StreamRecorder;
}());
exports.StreamRecorder = StreamRecorder;
