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
exports.defaultRecorderOptions = {
    workingDirectory: __dirname,
    generateSubdirectoryForSession: true,
    printMessages: false,
    cleanSegmentFiles: true,
    ensureDirectoryExists: true,
    retryTimesIfRecordingExitedAbnormally: 0,
    automaticallyCreateOutfileIfExitedAbnormally: true,
};
var Recorder = /** @class */ (function () {
    function Recorder(url, options) {
        this._id = UniqueHelper_1.createUnique();
        this._url = url;
        this._options = __assign(__assign({}, exports.defaultRecorderOptions), options);
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
         * The current state.
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
    Recorder.prototype.setState = function (state) {
        if (state == RecorderState_1.RecorderState.RECORDING && this._options.onStart) {
            this._options.onStart();
        }
        if (state == RecorderState_1.RecorderState.FINISH && this._options.onComplete) {
            this._options.onComplete();
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
        if (this._process && this._process.isRunning()) {
            return true;
        }
        return (this._sessionInfo.state !== RecorderState_1.RecorderState.INITIAL &&
            this._sessionInfo.state !== RecorderState_1.RecorderState.FINISH &&
            this._sessionInfo.state !== RecorderState_1.RecorderState.EXITED_ABNORMALLY &&
            this._sessionInfo.state !== RecorderState_1.RecorderState.PAUSED);
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
     * @param url Stream URL
     */
    Recorder.prototype.start = function (url) {
        if (this._process && this._process.isRunning()) {
            console.warn('Process is busy.');
            return;
        }
        if (this._options.ensureDirectoryExists &&
            this._options.workingDirectory &&
            !fs.existsSync(this._options.workingDirectory)) {
            fs.mkdirSync(this._options.workingDirectory);
        }
        if (url) {
            this._url = url;
        }
        if (this._sessionInfo.state != RecorderState_1.RecorderState.PAUSED) {
            this._sessionInfo.sessionUnique = UniqueHelper_1.createUnique();
            var workDir = this._options.workingDirectory
                ? this._options.workingDirectory
                : __dirname;
            if (!fs.existsSync(workDir)) {
                throw new Error("Working directory '" + workDir + "' does not exist!");
            }
            this._currentWorkingDirectory = workDir;
            if (this._options.generateSubdirectoryForSession) {
                this._currentWorkingDirectory = path_1.join(workDir, this._sessionInfo.sessionUnique);
                if (!fs.existsSync(this._currentWorkingDirectory)) {
                    fs.mkdirSync(this._currentWorkingDirectory);
                }
            }
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
     * @param outfile Target output filename
     */
    Recorder.prototype.stop = function (outfile) {
        if (this._sessionInfo.state === RecorderState_1.RecorderState.FINISH) {
            return;
        }
        this.setState(RecorderState_1.RecorderState.STOPPING);
        this.killProcess();
        this.finish();
    };
    Recorder.prototype.finish = function (outfile) {
        var _this = this;
        var out = this._options.outfile;
        if (outfile) {
            out = outfile;
        }
        if (out) {
            var dir = path_1.dirname(out);
            if (this._options.ensureDirectoryExists && !fs.existsSync(dir)) {
                fs.mkdirSync(dir);
            }
            console.log('Start file creating', out);
            this.createOutputFile(out, function () {
                _this.cleanWorkingDirectory();
                _this.setState(RecorderState_1.RecorderState.FINISH);
            });
        }
        else {
            console.warn('No output file specified');
            this.setState(RecorderState_1.RecorderState.FINISH);
        }
    };
    Recorder.prototype.killProcess = function () {
        if (this._process) {
            this._process.kill();
        }
    };
    Recorder.prototype.recordForSession = function () {
        var _this = this;
        this._process = new FFmpegProcess_1.FFmpegProcess(this._options.ffmpegExecutable);
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
            workDirectory: this._currentWorkingDirectory,
            printMessages: this._options.printMessages,
            onExit: function (code, planned) {
                if (planned !== undefined && !planned) {
                    _this.setState(RecorderState_1.RecorderState.EXITED_ABNORMALLY);
                    if (_this._options
                        .retryTimesIfRecordingExitedAbnormally &&
                        _this._options
                            .retryTimesIfRecordingExitedAbnormally > 0 &&
                        _this._sessionInfo.retries <
                            _this._options
                                .retryTimesIfRecordingExitedAbnormally) {
                        _this._sessionInfo.retries =
                            _this._sessionInfo.retries + 1;
                        console.log('Retry recorder no. ' +
                            _this._sessionInfo.retries);
                        setTimeout(function () {
                            _this.recordForSession();
                        }, 2000);
                    }
                    else if (_this._options
                        .automaticallyCreateOutfileIfExitedAbnormally) {
                        console.log('Automatically finishing...');
                        setTimeout(function () {
                            _this.finish();
                        }, 1000);
                    }
                }
            },
        });
    };
    Recorder.prototype.createOutputFile = function (outfile, onProcessFinish) {
        var _a;
        if ((this._process && this._process.isRunning()) ||
            !this._currentWorkingDirectory) {
            return;
        }
        this.setState(RecorderState_1.RecorderState.CREATINGOUTFILE);
        var args;
        var tsFiles = this.getSessionSegmentFiles();
        var mergedSegmentList = this.mergeSegmentLists();
        if (!mergedSegmentList) {
            console.warn('Segment list not found');
            return;
        }
        if (tsFiles.length == 0) {
            console.error('Could not find segment files');
            return;
        }
        else if (tsFiles.length == 1) {
            args = ['-i', tsFiles[0], '-map', '0', '-c', 'copy', outfile];
        }
        else {
            args = [
                '-f',
                'concat',
                '-i',
                mergedSegmentList,
                '-c',
                'copy',
                outfile,
            ];
        }
        (_a = this._process) === null || _a === void 0 ? void 0 : _a.start(args, {
            workDirectory: this._currentWorkingDirectory,
            printMessages: this._options.printMessages,
            onExit: function (code) {
                onProcessFinish();
            },
        });
    };
    Recorder.prototype.mergeSegmentLists = function () {
        var segLists = this.getSessionSegmentLists();
        console.log('seglists', segLists);
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
        if (!this._options.cleanSegmentFiles ||
            !this._currentWorkingDirectory ||
            !fs.existsSync(this._currentWorkingDirectory)) {
            return;
        }
        if (this._options.generateSubdirectoryForSession) {
            FileHelper_1.deleteFolderRecursive(this._currentWorkingDirectory);
        }
        else {
            this.setState(RecorderState_1.RecorderState.CLEANING);
            this.getSessionSegmentFiles().forEach(function (f) {
                fs.unlinkSync(f);
            });
            this.getSessionSegmentLists().forEach(function (f) {
                fs.unlinkSync(f);
            });
            var mergedSegmentList = path_1.join(this._currentWorkingDirectory, "seglist_" + this._sessionInfo.sessionUnique + "_merged.txt");
            if (fs.existsSync(mergedSegmentList)) {
                fs.unlinkSync(mergedSegmentList);
            }
        }
    };
    return Recorder;
}());
exports.Recorder = Recorder;
