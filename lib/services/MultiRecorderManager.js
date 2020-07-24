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
exports.MultiRecorderManager = exports.defaultMultiRecorderManagerOptions = void 0;
var StreamRecorder_1 = require("./StreamRecorder");
var models_1 = require("../models");
var Semaphore_1 = require("./Semaphore");
var log4js_api_1 = require("@log4js-node/log4js-api");
var GenericEvent_1 = require("../helpers/GenericEvent");
var logger = log4js_api_1.getLogger('ffmpeg-stream-recorder');
exports.defaultMultiRecorderManagerOptions = {
    autoRemoveWhenFinished: false,
    maxConcurrentlyCreatingOutfiles: -1,
};
var MultiRecorderManager = /** @class */ (function () {
    function MultiRecorderManager(options) {
        this.recorders = {};
        this._onRecorderStateChangeEvent = new GenericEvent_1.GenericEvent();
        this._options = __assign(__assign({}, exports.defaultMultiRecorderManagerOptions), options);
        if (this.isUseSemaphore) {
            this._semaphore = new Semaphore_1.Semaphore(this._options.maxConcurrentlyCreatingOutfiles);
        }
    }
    Object.defineProperty(MultiRecorderManager.prototype, "isUseSemaphore", {
        get: function () {
            return (this._options.maxConcurrentlyCreatingOutfiles !== undefined &&
                this._options.maxConcurrentlyCreatingOutfiles > 0);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MultiRecorderManager.prototype, "options", {
        get: function () {
            return this._options;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MultiRecorderManager.prototype, "onRecorderStateChangeEvent", {
        get: function () {
            return this._onRecorderStateChangeEvent.expose();
        },
        enumerable: false,
        configurable: true
    });
    MultiRecorderManager.prototype.create = function (request, onStateChange) {
        var _this = this;
        var recorderOptions = this._options;
        var autocreateOutputInSemaphore = this.isUseSemaphore && this._options.automaticallyCreateOutfileIfExitedAbnormally;
        if (autocreateOutputInSemaphore) {
            recorderOptions.automaticallyCreateOutfileIfExitedAbnormally = false;
        }
        if (onStateChange) {
            this._onRecorderStateChangeEvent.on(onStateChange);
        }
        recorderOptions.onStateChange = function (data) {
            if (data.sessionInfo) {
                var recorderWithRequest = _this.getRecorderWithReuquest(data.sessionInfo.recorderId);
                if (recorderWithRequest) {
                    recorderWithRequest.request.state = data.newState;
                    _this.recorders[recorderWithRequest.recorder.id].request = recorderWithRequest.request;
                    _this._onRecorderStateChangeEvent.trigger({
                        recorder: recorderWithRequest.request,
                        newState: data.newState,
                        oldState: data.oldState,
                        sessionInfo: data.sessionInfo,
                    });
                    if (data.newState == models_1.RecorderState.PROCESS_EXITED_ABNORMALLY && autocreateOutputInSemaphore) {
                        logger.debug('Automatically stopping recorder via manager', _this.recorders[data.sessionInfo.recorderId]);
                        _this.stop(request);
                    }
                    else if (data.newState == models_1.RecorderState.COMPLETED && _this._options.autoRemoveWhenFinished) {
                        logger.debug('Automatically removing recorder from manager', _this.recorders[data.sessionInfo.recorderId]);
                        setTimeout(function () {
                            _this.remove(data.sessionInfo.recorderId, true);
                        });
                    }
                }
            }
        };
        var rec = new StreamRecorder_1.StreamRecorder(request.url, __assign(__assign({}, recorderOptions), {
            outfile: request.outfile,
        }));
        logger.debug('Created recorder', rec);
        request.id = rec.id;
        request.state = rec.state;
        this.recorders[rec.id] = {
            request: request,
            recorder: rec,
        };
        if (this._options.onRecorderAdded) {
            this._options.onRecorderAdded(request);
        }
        if (this._options.onRecorderListChange) {
            this._options.onRecorderListChange(this.getRequestItems());
        }
        return request;
    };
    MultiRecorderManager.prototype.start = function (recorder) {
        var rec = this.getRecorder(recorder);
        if (rec) {
            logger.debug('Starting recorder via manager', rec);
            rec.start();
        }
    };
    MultiRecorderManager.prototype.stop = function (recorder) {
        var rec = this.getRecorderWithReuquest(recorder);
        if (rec) {
            if (this._semaphore) {
                logger.debug('Stopping recorder via manager adding to semaphore', rec);
                this._semaphore.take(function (next) {
                    rec === null || rec === void 0 ? void 0 : rec.recorder.stop(undefined, function () {
                        next();
                    });
                });
                this.updateRecorderState(rec, models_1.RecorderState.WAITING_IN_QUEUE);
            }
            else {
                logger.debug('Stopping recorder via manager', rec);
                rec === null || rec === void 0 ? void 0 : rec.recorder.stop();
            }
        }
    };
    MultiRecorderManager.prototype.pause = function (recorder) {
        var rec = this.getRecorder(recorder);
        if (rec) {
            logger.debug('Pausing recorder via manager', rec);
            rec.pause();
        }
    };
    MultiRecorderManager.prototype.remove = function (recorder, force) {
        var rec = this.getRecorderWithReuquest(recorder);
        if (rec && rec.request.id) {
            if (!rec.recorder.isBusy() || force) {
                logger.debug('Removing recorder from manager', rec);
                var request = this.recorders[rec.request.id].request;
                this.recorders[rec.request.id] = undefined;
                if (this._options.onRecorderRemoved) {
                    this._options.onRecorderRemoved(request);
                }
                if (this._options.onRecorderListChange) {
                    this._options.onRecorderListChange(this.getRequestItems());
                }
            }
            else {
                throw Error('Recorder seems to be busy. You should stop recording before removing it.');
            }
        }
    };
    MultiRecorderManager.prototype.updateRecorderState = function (recorder, newState, oldState, sessionInfo) {
        this.recorders[recorder.recorder.id].request.state = newState;
        this._onRecorderStateChangeEvent.trigger({
            recorder: recorder.request,
            newState: newState,
            oldState: oldState,
            sessionInfo: sessionInfo,
        });
    };
    MultiRecorderManager.prototype.hasBusyRecorders = function () {
        return this.getRecorderItems().filter(function (r) { return r.isBusy(); }).length > 0;
    };
    MultiRecorderManager.prototype.getRecorderWithReuquest = function (recorder) {
        var rec;
        if (typeof recorder === 'string' || recorder instanceof String) {
            rec = this.recorders[recorder];
        }
        else if (recorder.id) {
            rec = this.recorders[recorder.id];
        }
        return rec;
    };
    MultiRecorderManager.prototype.getRecorder = function (recorder) {
        var _a;
        return (_a = this.getRecorderWithReuquest(recorder)) === null || _a === void 0 ? void 0 : _a.recorder;
    };
    MultiRecorderManager.prototype.getReuqestItem = function (recorder) {
        var _a;
        return (_a = this.getRecorderWithReuquest(recorder)) === null || _a === void 0 ? void 0 : _a.request;
    };
    MultiRecorderManager.prototype.getRequestItems = function () {
        return this.getRecorderWithRequestItems().map(function (i) { return i.request; });
    };
    MultiRecorderManager.prototype.getRecorderItems = function () {
        return this.getRecorderWithRequestItems().map(function (i) { return i.recorder; });
    };
    MultiRecorderManager.prototype.getRecorderWithRequestItems = function () {
        var items = [];
        for (var key in this.recorders) {
            var rec = this.getRecorderWithReuquest(key);
            if (rec) {
                items.push(rec);
            }
        }
        return items;
    };
    MultiRecorderManager.prototype.existsRecorder = function (recorder) {
        return this.getRecorderWithReuquest(recorder) !== undefined;
    };
    return MultiRecorderManager;
}());
exports.MultiRecorderManager = MultiRecorderManager;
