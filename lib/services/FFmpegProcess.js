"use strict";
// https://itnext.io/step-by-step-building-and-publishing-an-npm-typescript-package-44fe7164964c
// https://medium.com/@mtiller/debugging-with-typescript-jest-ts-jest-and-visual-studio-code-ef9ca8644132
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.FFmpegProcess = void 0;
var child_process_1 = require("child_process");
var encoding = 'utf8';
var defaultProcessOptions = {
    workDirectory: __dirname,
    printMessages: false,
};
var FFmpegProcess = /** @class */ (function () {
    function FFmpegProcess(executable) {
        this._childProcess = null;
        this._exitCode = -1;
        this._plannedExit = false;
        this._executable = executable ? executable : 'ffmpeg';
    }
    FFmpegProcess.prototype.isRunning = function () {
        return this._childProcess !== null && !this._childProcess.killed;
    };
    Object.defineProperty(FFmpegProcess.prototype, "exitCode", {
        get: function () {
            return this._exitCode;
        },
        enumerable: false,
        configurable: true
    });
    FFmpegProcess.prototype.start = function (args, options) {
        var _this = this;
        var opt = __assign(__assign({}, defaultProcessOptions), options);
        this._plannedExit = false;
        this._childProcess = child_process_1.spawn(this._executable, args, {
            cwd: options === null || options === void 0 ? void 0 : options.workDirectory,
        });
        this._childProcess.stdin.setDefaultEncoding(encoding);
        this._childProcess.stdout.setEncoding(encoding);
        this._childProcess.stderr.setEncoding(encoding);
        this._childProcess.stdin.on('data', function (data) {
            return _this.handleMessage(data, 'stdin', opt);
        });
        this._childProcess.stdout.on('data', function (data) {
            return _this.handleMessage(data, 'stdout', opt);
        });
        this._childProcess.stderr.on('data', function (data) {
            return _this.handleMessage(data, 'stderr', opt);
        });
        this._childProcess.on('close', function (code, signal) {
            if (options === null || options === void 0 ? void 0 : options.printMessages) {
                console.log('process exit code ' + code);
            }
            if (opt.onExit) {
                opt.onExit(code, _this._plannedExit, signal);
            }
            _this._childProcess = null;
        });
    };
    FFmpegProcess.prototype.kill = function () {
        if (this._childProcess) {
            this._plannedExit = true;
            this._childProcess.stdin.write('q');
            this._childProcess.kill('SIGINT');
        }
    };
    FFmpegProcess.prototype.handleMessage = function (data, source, options) {
        var str = data.toString();
        var lines = str.split(/(\r?\n)/g);
        var msg = lines.join('');
        if (options === null || options === void 0 ? void 0 : options.printMessages) {
            console.log(msg);
        }
        if (options === null || options === void 0 ? void 0 : options.onMessage) {
            options === null || options === void 0 ? void 0 : options.onMessage(msg, source);
        }
    };
    return FFmpegProcess;
}());
exports.FFmpegProcess = FFmpegProcess;
