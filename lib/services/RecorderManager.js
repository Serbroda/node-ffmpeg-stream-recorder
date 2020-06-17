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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecorderManager = exports.defaultRecorderManagerOptions = void 0;
var Recorder_1 = require("./Recorder");
var models_1 = require("../models");
var Semaphore_1 = require("./Semaphore");
var log4js_api_1 = require("@log4js-node/log4js-api");
var logger = log4js_api_1.getLogger('ffmpeg-stream-recorder');
exports.defaultRecorderManagerOptions = {
    autoRemoveWhenFinished: false,
    maxConcurrentlyCreatingOutfiles: -1,
};
var RecorderManager = /** @class */ (function () {
    function RecorderManager(options) {
        this.recorders = {};
        this._options = __assign(__assign({}, exports.defaultRecorderManagerOptions), options);
        if (this.isUseSemaphore) {
            this._semaphore = new Semaphore_1.Semaphore(this._options.maxConcurrentlyCreatingOutfiles);
        }
    }
    Object.defineProperty(RecorderManager.prototype, "isUseSemaphore", {
        get: function () {
            return (this._options.maxConcurrentlyCreatingOutfiles !== undefined &&
                this._options.maxConcurrentlyCreatingOutfiles > 0);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(RecorderManager.prototype, "options", {
        get: function () {
            return this._options;
        },
        enumerable: false,
        configurable: true
    });
    RecorderManager.prototype.create = function (request, onStateChange) {
        var _this = this;
        var recorderOptions = this._options;
        var autocreateOutputInSemaphore = this.isUseSemaphore && this._options.automaticallyCreateOutfileIfExitedAbnormally;
        if (autocreateOutputInSemaphore) {
            recorderOptions.automaticallyCreateOutfileIfExitedAbnormally = false;
        }
        recorderOptions.onStateChange = function (newState, oldState, sessionInfo) {
            if (sessionInfo) {
                if (_this.recorders[sessionInfo.recorderId]) {
                    _this.recorders[sessionInfo.recorderId].request.state = newState;
                    if (onStateChange) {
                        onStateChange(_this.recorders[sessionInfo.recorderId].request, newState);
                    }
                    if (newState == models_1.RecorderState.PROCESS_EXITED_ABNORMALLY && autocreateOutputInSemaphore) {
                        _this.stop(_this.recorders[sessionInfo.recorderId].request);
                    }
                    else if (newState == models_1.RecorderState.COMPLETED && _this._options.autoRemoveWhenFinished) {
                        logger.debug('Automatically removing recorder', _this.recorders[sessionInfo.recorderId]);
                        _this.remove(sessionInfo.recorderId);
                    }
                }
            }
        };
        var rec = new Recorder_1.Recorder(request.url, __assign(__assign({}, recorderOptions), {
            outfile: request.outfile,
        }));
        request.id = rec.id;
        request.state = rec.state;
        this.recorders[rec.id] = {
            request: request,
            recorder: rec,
        };
        if (this._options.onRecorderListChange) {
            this._options.onRecorderListChange(this.getRequestItems());
        }
        return request;
    };
    RecorderManager.prototype.start = function (recorder) {
        var rec = this.getRecorder(recorder);
        if (rec) {
            rec.start();
        }
    };
    RecorderManager.prototype.stop = function (recorder) {
        var rec = this.getRecorder(recorder);
        if (rec) {
            if (this._semaphore) {
                this._semaphore.take(function () { return rec.stop(); });
            }
            else {
                rec.stop();
            }
        }
    };
    RecorderManager.prototype.pause = function (recorder) {
        var rec = this.getRecorder(recorder);
        if (rec) {
            rec.pause();
        }
    };
    RecorderManager.prototype.remove = function (recorder, force) {
        var rec = this.getRecorderWithReuquest(recorder);
        if (rec && rec.request.id) {
            if (!rec.recorder.isBusy() || force) {
                this.recorders[rec.request.id] = undefined;
                if (this._options.onRecorderListChange) {
                    this._options.onRecorderListChange(this.getRequestItems());
                }
            }
            else {
                throw Error('Recorder seems to be busy. You should stop recording before removing it.');
            }
        }
    };
    RecorderManager.prototype.hasBusyRecorders = function () {
        return this.getRecorderItems().filter(function (r) { return r.isBusy(); }).length > 0;
    };
    RecorderManager.prototype.getRecorderWithReuquest = function (recorder) {
        var rec;
        if (typeof recorder === 'string' || recorder instanceof String) {
            rec = this.recorders[recorder];
        }
        else if (recorder.id) {
            rec = this.recorders[recorder.id];
        }
        return rec;
    };
    RecorderManager.prototype.getRecorder = function (recorder) {
        var _a;
        return (_a = this.getRecorderWithReuquest(recorder)) === null || _a === void 0 ? void 0 : _a.recorder;
    };
    RecorderManager.prototype.getReuqestItem = function (recorder) {
        var _a;
        return (_a = this.getRecorderWithReuquest(recorder)) === null || _a === void 0 ? void 0 : _a.request;
    };
    RecorderManager.prototype.getRequestItems = function () {
        return this.getRecorderWithRequestItems().map(function (i) { return i.request; });
    };
    RecorderManager.prototype.getRecorderItems = function () {
        return this.getRecorderWithRequestItems().map(function (i) { return i.recorder; });
    };
    RecorderManager.prototype.getRecorderWithRequestItems = function () {
        var items = [];
        for (var key in this.recorders) {
            var rec = this.getRecorderWithReuquest(key);
            if (rec) {
                items.push(rec);
            }
        }
        return items;
    };
    RecorderManager.prototype.existsRecorder = function (recorder) {
        return this.getRecorderWithReuquest(recorder) !== undefined;
    };
    return RecorderManager;
}());
exports.RecorderManager = RecorderManager;
