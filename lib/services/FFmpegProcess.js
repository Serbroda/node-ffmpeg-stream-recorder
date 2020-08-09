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
exports.FFmpegProcess = void 0;
var child_process_1 = require("child_process");
var ThreadingHelper_1 = require("../helpers/ThreadingHelper");
var GenericEvent_1 = require("../helpers/GenericEvent");
var config_1 = require("../config");
var FileHelper_1 = require("../helpers/FileHelper");
var log4js_api_1 = require("@log4js-node/log4js-api");
var logger = log4js_api_1.getLogger('ffmpeg-stream-recorder');
var encoding = 'utf8';
var FFmpegProcess = /** @class */ (function () {
    function FFmpegProcess() {
        this._onExitEvent = new GenericEvent_1.GenericEvent();
        this._onExitAbnormallyEvent = new GenericEvent_1.GenericEvent();
        this._onMessageEvent = new GenericEvent_1.GenericEvent();
        this._childProcess = null;
        this._exitCode = -1;
        this._plannedKill = false;
        this._startedAt = null;
        this._exitedAt = null;
    }
    Object.defineProperty(FFmpegProcess.prototype, "onExit", {
        get: function () {
            return this._onExitEvent.expose();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(FFmpegProcess.prototype, "onExitAbnormally", {
        get: function () {
            return this._onExitAbnormallyEvent.expose();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(FFmpegProcess.prototype, "onMessage", {
        get: function () {
            return this._onMessageEvent.expose();
        },
        enumerable: false,
        configurable: true
    });
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
    FFmpegProcess.prototype.isRunning = function () {
        return this._childProcess !== null && !this._childProcess.killed;
    };
    FFmpegProcess.prototype.startAsync = function (args, options) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        try {
                            _this.onExit.once(function (result) {
                                resolve(result);
                            });
                            _this.start(args, options);
                        }
                        catch (error) {
                            reject(error);
                        }
                    })];
            });
        });
    };
    FFmpegProcess.prototype.start = function (args, options) {
        var _this = this;
        var opt = __assign({ cwd: __dirname }, options);
        logger.debug('Starting ffmpeg process with', {
            args: args,
            options: opt,
        });
        if (!this.waitForProcessKilled(500)) {
            throw new Error('Process seems to be busy. Kill the process before starting a new one');
        }
        FileHelper_1.mkdir(opt.cwd);
        if (options === null || options === void 0 ? void 0 : options.onExit) {
            this.onExit.on(options.onExit);
        }
        if (options === null || options === void 0 ? void 0 : options.onMessage) {
            this.onMessage.on(options.onMessage);
        }
        this._plannedKill = false;
        this._startedAt = new Date();
        this._exitedAt = null;
        this._childProcess = child_process_1.spawn(config_1.configuration.executable, args, {
            cwd: opt.cwd,
        });
        this._childProcess.stdin.setDefaultEncoding(encoding);
        this._childProcess.stdout.setEncoding(encoding);
        this._childProcess.stderr.setEncoding(encoding);
        this._childProcess.stdin.on('data', function (data) { return _this.handleMessage(data); });
        this._childProcess.stdout.on('data', function (data) { return _this.handleMessage(data); });
        this._childProcess.stderr.on('data', function (data) { return _this.handleMessage(data); });
        this._childProcess.once('close', function (code, signal) {
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
            _this._childProcess = null;
            _this._onExitEvent.trigger(result, 200);
            if (!result.plannedKill) {
                _this._onExitAbnormallyEvent.trigger(result, 200);
            }
        });
    };
    FFmpegProcess.prototype.killAsync = function (timeout) {
        if (timeout === void 0) { timeout = 2000; }
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        _this.kill();
                        var killed = _this.waitForProcessKilled(timeout);
                        if (killed) {
                            setTimeout(function () {
                                resolve();
                            }, 500);
                        }
                        else {
                            reject(new Error('Process did not exited in time'));
                        }
                    })];
            });
        });
    };
    FFmpegProcess.prototype.kill = function () {
        this._plannedKill = true;
        this.killProcess();
    };
    FFmpegProcess.prototype.killProcess = function () {
        if (this._childProcess && !this._childProcess.killed) {
            if (!this._childProcess.stdin.destroyed) {
                this._childProcess.stdin.write('q');
            }
            this._childProcess.kill('SIGINT');
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
    FFmpegProcess.prototype.handleMessage = function (data) {
        var str = data.toString();
        var lines = str.split(/(\r?\n)/g);
        var msg = lines.join('');
        logger.trace(msg);
        this._onMessageEvent.trigger(msg);
    };
    return FFmpegProcess;
}());
exports.FFmpegProcess = FFmpegProcess;
