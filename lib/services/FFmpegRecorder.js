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
exports.FFmpegRecorder = exports.defaultFFmpegRecorderOptions = void 0;
var FFmpegProcess_1 = require("./FFmpegProcess");
var FileHelper_1 = require("../helpers/FileHelper");
var path_1 = require("path");
var fs = __importStar(require("fs"));
var FFmpegRecorderState_1 = require("../models/FFmpegRecorderState");
var UniqueHelper_1 = require("../helpers/UniqueHelper");
exports.defaultFFmpegRecorderOptions = {
    workingDirectory: __dirname,
    generateSubdirectoryForSession: true,
    printMessages: false,
    cleanSegmentFiles: true,
    ensureDirectoryExists: true,
};
var FFmpegRecorder = /** @class */ (function () {
    function FFmpegRecorder(url, options) {
        this._id = UniqueHelper_1.createUnique();
        this._url = url;
        this._options = __assign(__assign({}, exports.defaultFFmpegRecorderOptions), options);
        this._sessionInfo = {
            id: this._id,
            unique: this._id,
            state: FFmpegRecorderState_1.FFmpegRecorderState.INITIAL,
            startCounter: 0,
        };
    }
    Object.defineProperty(FFmpegRecorder.prototype, "id", {
        get: function () {
            return this._id;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(FFmpegRecorder.prototype, "sessionInfo", {
        get: function () {
            return this._sessionInfo;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(FFmpegRecorder.prototype, "state", {
        get: function () {
            return this._sessionInfo.state;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(FFmpegRecorder.prototype, "url", {
        get: function () {
            return this._url;
        },
        set: function (url) {
            this._url = url;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(FFmpegRecorder.prototype, "options", {
        get: function () {
            return this._options;
        },
        enumerable: false,
        configurable: true
    });
    FFmpegRecorder.prototype.setState = function (state) {
        if (state == FFmpegRecorderState_1.FFmpegRecorderState.RECORDING && this._options.onStart) {
            this._options.onStart();
        }
        if (state == FFmpegRecorderState_1.FFmpegRecorderState.FINISH && this._options.onComplete) {
            this._options.onComplete();
        }
        if (this._options.onStateChange) {
            this._options.onStateChange(state, this._sessionInfo.state, this._sessionInfo);
        }
        this.sessionInfo.state = state;
    };
    FFmpegRecorder.prototype.isBusy = function () {
        if (this._process && this._process.isRunning()) {
            return true;
        }
        return (this._sessionInfo.state !== FFmpegRecorderState_1.FFmpegRecorderState.INITIAL &&
            this._sessionInfo.state !== FFmpegRecorderState_1.FFmpegRecorderState.FINISH &&
            this._sessionInfo.state !== FFmpegRecorderState_1.FFmpegRecorderState.PAUSED);
    };
    FFmpegRecorder.prototype.sessionSegmentLists = function () {
        if (!this._currentWorkingDirectory) {
            return [];
        }
        return FileHelper_1.findFiles(this._currentWorkingDirectory, new RegExp("seglist_" + this._sessionInfo.unique + "_\\d*\\.txt"));
    };
    FFmpegRecorder.prototype.sessionSegmentFiles = function () {
        if (!this._currentWorkingDirectory) {
            return [];
        }
        return FileHelper_1.findFiles(this._currentWorkingDirectory, new RegExp("seg_" + this._sessionInfo.unique + "_\\d*_\\d*\\.ts"));
    };
    FFmpegRecorder.prototype.start = function () {
        if (this._process && this._process.isRunning()) {
            console.warn('Process is busy.');
            return;
        }
        if (this._options.ensureDirectoryExists &&
            this._options.workingDirectory &&
            !fs.existsSync(this._options.workingDirectory)) {
            fs.mkdirSync(this._options.workingDirectory);
        }
        if (this._sessionInfo.state != FFmpegRecorderState_1.FFmpegRecorderState.PAUSED) {
            this._sessionInfo.unique = UniqueHelper_1.createUnique();
            var workDir = this._options.workingDirectory
                ? this._options.workingDirectory
                : __dirname;
            if (!fs.existsSync(workDir)) {
                throw new Error("Working directory '" + workDir + "' does not exist!");
            }
            this._currentWorkingDirectory = workDir;
            if (this._options.generateSubdirectoryForSession) {
                this._currentWorkingDirectory = path_1.join(workDir, this._sessionInfo.unique);
                if (!fs.existsSync(this._currentWorkingDirectory)) {
                    fs.mkdirSync(this._currentWorkingDirectory);
                }
            }
        }
        this._sessionInfo.startCounter = this._sessionInfo.startCounter + 1;
        this.recordForSession();
    };
    FFmpegRecorder.prototype.pause = function () {
        this.setState(FFmpegRecorderState_1.FFmpegRecorderState.PAUSED);
        this.killProcess();
    };
    FFmpegRecorder.prototype.stop = function (outfile) {
        var _this = this;
        if (this._sessionInfo.state === FFmpegRecorderState_1.FFmpegRecorderState.FINISH) {
            return;
        }
        this.setState(FFmpegRecorderState_1.FFmpegRecorderState.STOPPING);
        this.killProcess();
        var out = this._options.outfile;
        if (outfile) {
            out = outfile;
        }
        if (out) {
            var dir = path_1.dirname(out);
            if (this._options.ensureDirectoryExists && !fs.existsSync(dir)) {
                fs.mkdirSync(dir);
            }
            this.createOutputFile(out, function () {
                _this.cleanWorkingDirectory();
                _this.setState(FFmpegRecorderState_1.FFmpegRecorderState.FINISH);
            });
        }
        else {
            console.warn('No output file specified');
            this.setState(FFmpegRecorderState_1.FFmpegRecorderState.FINISH);
        }
    };
    FFmpegRecorder.prototype.killProcess = function () {
        if (this._process) {
            this._process.kill();
        }
    };
    FFmpegRecorder.prototype.recordForSession = function () {
        var _this = this;
        this._process = new FFmpegProcess_1.FFmpegProcess(this._options.ffmpegExecutable);
        this.setState(FFmpegRecorderState_1.FFmpegRecorderState.RECORDING);
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
            "seglist_" + this._sessionInfo.unique + "_" + this._sessionInfo.startCounter
                .toString()
                .padStart(2, '0') + ".txt",
            '-segment_list_entry_prefix',
            'file ',
            "seg_" + this._sessionInfo.unique + "_" + this._sessionInfo.startCounter
                .toString()
                .padStart(2, '0') + "_%05d.ts",
        ], {
            workDirectory: this._currentWorkingDirectory,
            printMessages: this._options.printMessages,
            onExit: function (code) {
                if (_this._sessionInfo.state ===
                    FFmpegRecorderState_1.FFmpegRecorderState.RECORDING) {
                    _this.setState(FFmpegRecorderState_1.FFmpegRecorderState.PAUSED);
                }
            },
        });
    };
    FFmpegRecorder.prototype.createOutputFile = function (outfile, onProcessFinish) {
        var _a;
        if ((this._process && this._process.isRunning()) ||
            !this._currentWorkingDirectory) {
            return;
        }
        this.setState(FFmpegRecorderState_1.FFmpegRecorderState.CREATINGOUTFILE);
        var args;
        var tsFiles = this.sessionSegmentFiles();
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
    FFmpegRecorder.prototype.mergeSegmentLists = function () {
        var segLists = this.sessionSegmentLists();
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
            var mergedOutFile = path_1.join(this._currentWorkingDirectory, "seglist_" + this._sessionInfo.unique + "_merged.txt");
            var status_1 = FileHelper_1.mergeFiles(segLists, mergedOutFile);
            return mergedOutFile;
        }
    };
    FFmpegRecorder.prototype.cleanWorkingDirectory = function () {
        if (this._currentWorkingDirectory && this._options.cleanSegmentFiles) {
            this.setState(FFmpegRecorderState_1.FFmpegRecorderState.CLEANING);
            this.sessionSegmentFiles().forEach(function (f) {
                fs.unlinkSync(f);
            });
            this.sessionSegmentLists().forEach(function (f) {
                fs.unlinkSync(f);
            });
            var mergedSegmentList = path_1.join(this._currentWorkingDirectory, "seglist_" + this._sessionInfo.unique + "_merged.txt");
            if (fs.existsSync(mergedSegmentList)) {
                fs.unlinkSync(mergedSegmentList);
            }
            if (this._options.generateSubdirectoryForSession) {
                fs.rmdirSync(this._currentWorkingDirectory);
            }
        }
    };
    return FFmpegRecorder;
}());
exports.FFmpegRecorder = FFmpegRecorder;
