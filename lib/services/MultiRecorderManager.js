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
exports.MultiRecorderManager = void 0;
var StreamRecorder_1 = require("./StreamRecorder");
var models_1 = require("../models");
var Semaphore_1 = require("./Semaphore");
var log4js_api_1 = require("@log4js-node/log4js-api");
var GenericEvent_1 = require("../helpers/GenericEvent");
var logger = log4js_api_1.getLogger('ffmpeg-stream-recorder');
var MultiRecorderManager = /** @class */ (function () {
    function MultiRecorderManager(options) {
        this.recorders = {};
        this._onRecorderStateChangeEvent = new GenericEvent_1.GenericEvent();
        this._options = __assign({ autoRemoveWhenFinished: false, maxConcurrentlyCreatingOutfiles: -1 }, options);
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
        var autocreateOutputInSemaphore = this.isUseSemaphore && this._options.createOnExit;
        if (autocreateOutputInSemaphore) {
            recorderOptions.createOnExit = false;
        }
        if (onStateChange) {
            this._onRecorderStateChangeEvent.on(onStateChange);
        }
        recorderOptions.onStateChange = function (data) {
            if (data.sessionInfo) {
                var rec_1 = _this.getRecorder(data.sessionInfo.recorderId);
                if (rec_1) {
                    _this._onRecorderStateChangeEvent.trigger({
                        recorder: rec_1,
                        newState: data.newState,
                        oldState: data.oldState,
                        sessionInfo: data.sessionInfo,
                    });
                    if (data.newState == models_1.RecorderState.PROCESS_EXITED_ABNORMALLY && autocreateOutputInSemaphore) {
                        logger.debug('Automatically stopping recorder via manager', _this.recorders[data.sessionInfo.recorderId]);
                        _this.stop(rec_1);
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
        this.recorders[rec.id] = rec;
        if (this._options.onRecorderAdded) {
            this._options.onRecorderAdded(rec);
        }
        if (this._options.onRecorderListChange) {
            this._options.onRecorderListChange(this.getRecorders());
        }
        return rec;
    };
    MultiRecorderManager.prototype.start = function (recorder) {
        var rec = this.getRecorder(recorder);
        if (rec) {
            logger.debug('Starting recorder via manager', rec);
            rec.start();
        }
    };
    MultiRecorderManager.prototype.stop = function (recorder) {
        var rec = this.getRecorder(recorder);
        if (rec) {
            if (this._semaphore) {
                logger.debug('Stopping recorder via manager adding to semaphore', rec);
                this._semaphore.take(function (next) {
                    rec.stop(undefined, function () {
                        next();
                    });
                });
                //this.updateRecorderState(rec, RecorderState.WAITING_IN_QUEUE);
            }
            else {
                logger.debug('Stopping recorder via manager', rec);
                rec.stop();
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
        var rec = this.getRecorder(recorder);
        if (rec) {
            if (!rec.isBusy() || force) {
                logger.debug('Removing recorder from manager', rec);
                this.recorders[rec.id] = undefined;
                if (this._options.onRecorderRemoved) {
                    this._options.onRecorderRemoved(rec);
                }
                if (this._options.onRecorderListChange) {
                    this._options.onRecorderListChange(this.getRecorders());
                }
            }
            else {
                throw Error('Recorder seems to be busy. You should stop recording before removing it.');
            }
        }
    };
    MultiRecorderManager.prototype.updateRecorderState = function (recorder, newState, oldState, sessionInfo) {
        this._onRecorderStateChangeEvent.trigger({
            recorder: recorder,
            newState: newState,
            oldState: oldState,
            sessionInfo: sessionInfo,
        });
    };
    MultiRecorderManager.prototype.hasBusyRecorders = function () {
        return this.getRecorders().filter(function (r) { return r.isBusy(); }).length > 0;
    };
    MultiRecorderManager.prototype.getRecorder = function (recorder) {
        if (typeof recorder === 'string') {
            return this.recorders[recorder];
        }
        else {
            return this.recorders[recorder.id];
        }
    };
    MultiRecorderManager.prototype.getRecorders = function () {
        var items = [];
        for (var key in this.recorders) {
            var rec = this.recorders[key];
            if (rec) {
                items.push(rec);
            }
        }
        return items;
    };
    MultiRecorderManager.prototype.existsRecorder = function (recorder) {
        return this.getRecorder(recorder) !== undefined;
    };
    return MultiRecorderManager;
}());
exports.MultiRecorderManager = MultiRecorderManager;
