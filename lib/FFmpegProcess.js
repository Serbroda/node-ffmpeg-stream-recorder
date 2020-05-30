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
var defaultOptions = {
    workDirectory: __dirname,
    messageEncoding: 'utf8',
    printMessages: false,
};
var FFmpegProcess = /** @class */ (function () {
    function FFmpegProcess(ffmpegExecutable) {
        this.process = null;
        this._exitCode = -1;
        this.ffmpegExecutable = ffmpegExecutable ? ffmpegExecutable : 'ffmpeg';
    }
    FFmpegProcess.prototype.isRunning = function () {
        return this.process !== null && !this.process.killed;
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
        var opt = __assign(__assign({}, defaultOptions), options);
        this.process = child_process_1.spawn(this.ffmpegExecutable, args, {
            cwd: options === null || options === void 0 ? void 0 : options.workDirectory,
        });
        var encoding = opt.messageEncoding ? opt.messageEncoding : 'utf8';
        this.process.stdin.setDefaultEncoding(encoding);
        this.process.stdout.setEncoding(encoding);
        this.process.stderr.setEncoding(encoding);
        this.process.stdin.on('data', function (data) {
            return _this.handleMessage(data, 'stdin', opt);
        });
        this.process.stdout.on('data', function (data) {
            return _this.handleMessage(data, 'stdout', opt);
        });
        this.process.stderr.on('data', function (data) {
            return _this.handleMessage(data, 'stderr', opt);
        });
        this.process.on('close', function (code, signal) {
            if (options === null || options === void 0 ? void 0 : options.printMessages) {
                console.log('process exit code ' + code);
            }
            if (opt.onExit) {
                opt.onExit(code, signal);
            }
            _this.process = null;
        });
    };
    FFmpegProcess.prototype.kill = function () {
        if (this.process) {
            this.process.stdin.write('q');
            this.process.kill('SIGINT');
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
