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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Recorder = exports.defaultRecorderOptions = void 0;
var FFmpegProcess_1 = require("./FFmpegProcess");
var FileHelper_1 = require("../helpers/FileHelper");
var path_1 = require("path");
var fs = __importStar(require("fs"));
var RecorderState_1 = require("../models/RecorderState");
var UniqueHelper_1 = require("../helpers/UniqueHelper");
var log4js_api_1 = require("@log4js-node/log4js-api");
var logger = log4js_api_1.getLogger('ffmpeg-stream-recorder');
exports.defaultRecorderOptions = {
    workingDirectory: __dirname,
    cleanSegmentFiles: true,
    ensureDirectoryExists: true,
    retryTimesIfRecordingExitedAbnormally: 0,
    automaticallyCreateOutfileIfExitedAbnormally: true,
    debug: false,
};
var Recorder = /** @class */ (function () {
    function Recorder(url, options) {
        this._id = UniqueHelper_1.createUnique();
        this._url = url;
        this._options = __assign(__assign({}, exports.defaultRecorderOptions), options);
        this._process = new FFmpegProcess_1.FFmpegProcess(this._options.ffmpegExecutable);
        this._sessionInfo = {
            recorderId: this._id,
            sessionUnique: this._id,
            state: RecorderState_1.RecorderState.INITIAL,
            startCounter: 0,
            retries: 0,
        };
    }
    Object.defineProperty(Recorder.prototype, "id", {
        /**
         * Unique recorder id e.g 19112814560452.
         */
        get: function () {
            return this._id;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Recorder.prototype, "options", {
        /**
         * The options for the recorder.
         */
        get: function () {
            return this._options;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Recorder.prototype, "sessionInfo", {
        /**
         * Informations about the current session.
         */
        get: function () {
            return this._sessionInfo;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Recorder.prototype, "state", {
        /**
         * Gets the current recorder state.
         */
        get: function () {
            return this._sessionInfo.state;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Recorder.prototype, "url", {
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
    Object.defineProperty(Recorder.prototype, "outFile", {
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
    Recorder.prototype.setState = function (state) {
        logger.debug("State changed: " + this._sessionInfo.state + " -> " + state);
        if (state == RecorderState_1.RecorderState.RECORDING && this._options.onStart) {
            this._options.onStart(this._sessionInfo);
        }
        if (state == RecorderState_1.RecorderState.COMPLETED && this._options.onComplete) {
            this._options.onComplete();
        }
        if (state == RecorderState_1.RecorderState.COMPLETED && this._completed) {
            this._completed();
        }
        if (this._options.onStateChange) {
            this._options.onStateChange(state, this._sessionInfo.state, this._sessionInfo);
        }
        this.sessionInfo.state = state;
    };
    /**
     * Gets true if recorder is currently busy or false if not.
     * @returns Busy true/false
     */
    Recorder.prototype.isBusy = function () {
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
    Recorder.prototype.getSessionSegmentLists = function () {
        if (!this._currentWorkingDirectory) {
            return [];
        }
        return FileHelper_1.findFiles(this._currentWorkingDirectory, new RegExp("seglist_" + this._sessionInfo.sessionUnique + "_\\d*\\.txt"));
    };
    /**
     * Gets a list of segment files for the current session.
     * @return List of segment files
     */
    Recorder.prototype.getSessionSegmentFiles = function () {
        if (!this._currentWorkingDirectory) {
            return [];
        }
        return FileHelper_1.findFiles(this._currentWorkingDirectory, new RegExp("seg_" + this._sessionInfo.sessionUnique + "_\\d*_\\d*\\.ts"));
    };
    /**
     * Starts the recording.
     */
    Recorder.prototype.start = function () {
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
    Recorder.prototype.pause = function () {
        this.setState(RecorderState_1.RecorderState.PAUSED);
        this.killProcess();
    };
    /**
     * Stops the recording and creats the output file.
     */
    Recorder.prototype.stop = function (outfile, onComplete) {
        if (this._sessionInfo.state === RecorderState_1.RecorderState.COMPLETED) {
            return;
        }
        if (outfile) {
            this.outFile = outfile;
        }
        this._completed = onComplete;
        this.setState(RecorderState_1.RecorderState.STOPPING);
        this.killProcess();
    };
    /**
     * Kills the current process. Alias for pause()
     */
    Recorder.prototype.kill = function () {
        this.pause();
    };
    Recorder.prototype.startNewSession = function () {
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
    Recorder.prototype.finish = function () {
        var _this = this;
        if (!this.outFile) {
            logger.error('Cannot finish recording because no output file is specified');
            this.setState(RecorderState_1.RecorderState.ERROR);
            return;
        }
        logger.debug('Finishing recording');
        var dir = path_1.dirname(this.outFile);
        if (this._options.ensureDirectoryExists && !fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        this.createOutputFile(this.outFile, function () {
            _this.cleanWorkingDirectory();
            _this.setState(RecorderState_1.RecorderState.COMPLETED);
        });
    };
    Recorder.prototype.killProcess = function () {
        this._process.kill();
    };
    Recorder.prototype.recordForSession = function () {
        var _this = this;
        this.setState(RecorderState_1.RecorderState.RECORDING);
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
    Recorder.prototype.createOutputFile = function (outfile, onProcessFinish) {
        logger.info('Creating output file', this.outFile);
        if ( /*!this._process.waitForProcessKilled(20000) ||*/!this._currentWorkingDirectory) {
            logger.error('Cannot create out file because process did not exit in time');
            this.setState(RecorderState_1.RecorderState.ERROR);
            return;
        }
        this.setState(RecorderState_1.RecorderState.CREATINGOUTFILE);
        var args;
        var tsFiles = this.getSessionSegmentFiles();
        var mergedSegmentList = this.mergeSegmentLists();
        if (!mergedSegmentList) {
            logger.error('Cannot find segment lists');
            return;
        }
        if (tsFiles.length == 0) {
            logger.error('Cannot not find segment files');
            return;
        }
        else if (tsFiles.length == 1) {
            args = ['-i', tsFiles[0], '-map', '0', '-c', 'copy', outfile];
        }
        else {
            args = ['-f', 'concat', '-i', mergedSegmentList, '-c', 'copy', outfile];
        }
        this._process.start(args, {
            cwd: this._currentWorkingDirectory,
            onExit: function (result) {
                onProcessFinish();
            },
        });
    };
    Recorder.prototype.mergeSegmentLists = function () {
        var segLists = this.getSessionSegmentLists();
        logger.debug('Merging segment lists', segLists);
        if (!segLists || segLists.length == 0) {
            return undefined;
        }
        else if (segLists.length == 1) {
            return segLists[0];
        }
        else {
            if (!this._currentWorkingDirectory) {
                return undefined;
            }
            var mergedOutFile = path_1.join(this._currentWorkingDirectory, "seglist_" + this._sessionInfo.sessionUnique + "_merged.txt");
            FileHelper_1.mergeFiles(segLists, mergedOutFile);
            return mergedOutFile;
        }
    };
    Recorder.prototype.cleanWorkingDirectory = function () {
        var _this = this;
        if (!this._options.cleanSegmentFiles ||
            !this._currentWorkingDirectory ||
            !fs.existsSync(this._currentWorkingDirectory)) {
            return;
        }
        logger.debug('Cleaning working directory ' + this._currentWorkingDirectory);
        setTimeout(function () {
            FileHelper_1.deleteFolderRecursive(_this._currentWorkingDirectory);
        }, 1000);
    };
    return Recorder;
}());
exports.Recorder = Recorder;
