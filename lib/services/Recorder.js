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
exports.Recorder = void 0;
var fs = __importStar(require("fs"));
var path = __importStar(require("path"));
var FFmpegProcess_1 = require("./FFmpegProcess");
var UniqueHelper_1 = require("../helpers/UniqueHelper");
var GenericEvent_1 = require("../helpers/GenericEvent");
var FileHelper_1 = require("../helpers/FileHelper");
var models_1 = require("../models");
var Recorder = /** @class */ (function () {
    function Recorder(id) {
        this._onStartEvent = new GenericEvent_1.GenericEvent();
        this._onStopEvent = new GenericEvent_1.GenericEvent();
        this._onStateChangeEvent = new GenericEvent_1.GenericEvent();
        this._state = models_1.RecorderState.INITIAL;
        this._id = id ? id : UniqueHelper_1.createUnique();
    }
    Object.defineProperty(Recorder.prototype, "id", {
        get: function () {
            return this._id;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Recorder.prototype, "onStart", {
        get: function () {
            return this._onStartEvent.expose();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Recorder.prototype, "onStop", {
        get: function () {
            return this._onStopEvent.expose();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Recorder.prototype, "onStateChangeEvent", {
        get: function () {
            return this._onStateChangeEvent.expose();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Recorder.prototype, "startedAt", {
        get: function () {
            return this._startedAt;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Recorder.prototype, "state", {
        get: function () {
            return this._state;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Recorder.prototype, "isRunning", {
        get: function () {
            return this._state === models_1.RecorderState.RECORDING || this._state === models_1.RecorderState.CONVERTING;
        },
        enumerable: false,
        configurable: true
    });
    Recorder.prototype.start = function (url, outfile, options) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        if (_this.isRunning) {
                            reject(new Error('Recorder is already running'));
                        }
                        else {
                            _this.setState(models_1.RecorderState.RECORDING);
                            var opt = __assign({ timestamp: false, args: [] }, options);
                            var out_1 = outfile;
                            var dir = path.dirname(out_1);
                            var ext_1 = path.extname(out_1);
                            var name_1 = path.basename(out_1, ext_1);
                            if (opt.timestamp) {
                                name_1 = name_1 + "-" + UniqueHelper_1.createIsoDateTime();
                                out_1 = path.join(dir, "" + name_1 + ext_1);
                            }
                            var temp_1 = path.join(dir, name_1 + ".ts");
                            _this._startedAt = new Date();
                            _this._recorderProcess = new FFmpegProcess_1.FFmpegProcess();
                            _this._recorderProcess.onExit.once(function (recordResult) {
                                var result = {
                                    url: url,
                                    startedAt: _this.startedAt,
                                    stoppedAt: new Date(),
                                    outfile: out_1,
                                    plannedStop: recordResult.plannedKill,
                                    converted: false,
                                };
                                if (ext_1 === '.ts' || !fs.existsSync(temp_1)) {
                                    _this.doFinish(resolve, result);
                                }
                                else {
                                    _this.setState(models_1.RecorderState.CONVERTING);
                                    _this.convert(temp_1, out_1).then(function () {
                                        FileHelper_1.rm(temp_1);
                                        result.stoppedAt = new Date();
                                        result.converted = true;
                                        _this.doFinish(resolve, result);
                                    });
                                }
                            });
                            var recordArgs = ['-i', url];
                            recordArgs = recordArgs.concat(opt.args);
                            recordArgs = recordArgs.concat(['-c:v', 'copy', '-c:a', 'copy', temp_1]);
                            _this._onStartEvent.trigger();
                            _this._recorderProcess.start(recordArgs);
                        }
                    })];
            });
        });
    };
    Recorder.prototype.stop = function () {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_b) {
                return [2 /*return*/, (_a = this._recorderProcess) === null || _a === void 0 ? void 0 : _a.killAsync()];
            });
        });
    };
    Recorder.prototype.convert = function (input, output) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        var convertProcess = new FFmpegProcess_1.FFmpegProcess();
                        convertProcess.onExit.once(function (convertResult) {
                            resolve();
                        });
                        convertProcess.start(['-i', input, '-acodec', 'copy', '-vcodec', 'copy', output]);
                    })];
            });
        });
    };
    Recorder.prototype.doFinish = function (resolve, result) {
        this.setState(models_1.RecorderState.FINISHED);
        this._onStopEvent.trigger(result);
        resolve(result);
    };
    Recorder.prototype.setState = function (state) {
        var stateChangeObj = {
            newState: state,
            previousState: this._state,
        };
        this._onStateChangeEvent.trigger(stateChangeObj);
        this._state = state;
    };
    return Recorder;
}());
exports.Recorder = Recorder;
