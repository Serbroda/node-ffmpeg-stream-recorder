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
var ThreadingHelper_1 = require("../helpers/ThreadingHelper");
var log4js_api_1 = require("@log4js-node/log4js-api");
var logger = log4js_api_1.getLogger('ffmpeg-stream-recorder');
var encoding = 'utf8';
var defaultProcessOptions = {
    cwd: __dirname,
};
var FFmpegProcess = /** @class */ (function () {
    function FFmpegProcess(executable) {
        this._childProcess = null;
        this._exitCode = -1;
        this._plannedKill = false;
        this._startedAt = null;
        this._exitedAt = null;
        this._executable = executable ? executable : 'ffmpeg';
    }
    FFmpegProcess.prototype.isRunning = function () {
        return this._childProcess !== null && !this._childProcess.killed;
    };
    Object.defineProperty(FFmpegProcess.prototype, "pid", {
        get: function () {
            var _a;
            return (_a = this._childProcess) === null || _a === void 0 ? void 0 : _a.pid;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(FFmpegProcess.prototype, "exitCode", {
        get: function () {
            return this._exitCode;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(FFmpegProcess.prototype, "startedAt", {
        get: function () {
            return this._startedAt;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(FFmpegProcess.prototype, "exitedAt", {
        get: function () {
            return this._exitedAt;
        },
        enumerable: false,
        configurable: true
    });
    FFmpegProcess.prototype.start = function (args, options) {
        var _this = this;
        if (!this.waitForProcessKilled(500)) {
            throw new Error('Process seems to be busy. Kill the process before starting a new one');
        }
        var opt = __assign(__assign({}, defaultProcessOptions), options);
        this._plannedKill = false;
        this._startedAt = new Date();
        this._exitedAt = null;
        this._childProcess = child_process_1.spawn(this._executable, args, {
            cwd: opt.cwd,
        });
        this._childProcess.stdin.setDefaultEncoding(encoding);
        this._childProcess.stdout.setEncoding(encoding);
        this._childProcess.stderr.setEncoding(encoding);
        this._childProcess.stdin.on('data', function (data) { return _this.handleMessage(data, 'stdin', opt); });
        this._childProcess.stdout.on('data', function (data) { return _this.handleMessage(data, 'stdout', opt); });
        this._childProcess.stderr.on('data', function (data) { return _this.handleMessage(data, 'stderr', opt); });
        this._childProcess.on('close', function (code, signal) {
            _this._exitedAt = new Date();
            var result = {
                exitCode: code,
                plannedKill: _this._plannedKill,
                startedAt: _this._startedAt,
                exitedAt: _this._exitedAt,
                signal: signal,
                options: opt,
            };
            logger.debug('Process exited with result', result);
            if (opt.onExit) {
                opt.onExit(result);
            }
            _this._childProcess = null;
        });
    };
    FFmpegProcess.prototype.kill = function () {
        if (this._childProcess && !this._childProcess.killed) {
            this._plannedKill = true;
            if (!this._childProcess.stdin.destroyed) {
                this._childProcess.stdin.write('q');
            }
            this._childProcess.kill('SIGINT');
            this.waitForProcessKilled(500);
        }
    };
    FFmpegProcess.prototype.waitForProcessKilled = function (timeoutMillis) {
        if (!this._childProcess) {
            return true;
        }
        var counter = 0;
        var millis = timeoutMillis ? timeoutMillis / 10 : -1;
        while (!this._childProcess.killed && (millis < 1 || counter < millis)) {
            ThreadingHelper_1.sleep(10);
            counter++;
        }
        return this._childProcess.killed;
    };
    FFmpegProcess.prototype.handleMessage = function (data, source, options) {
        var str = data.toString();
        var lines = str.split(/(\r?\n)/g);
        var msg = lines.join('');
        logger.trace(msg);
        if (options === null || options === void 0 ? void 0 : options.onMessage) {
            options === null || options === void 0 ? void 0 : options.onMessage(msg, source);
        }
    };
    return FFmpegProcess;
}());
exports.FFmpegProcess = FFmpegProcess;
