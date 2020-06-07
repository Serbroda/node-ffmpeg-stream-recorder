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
exports.FFmpegRecorderManager = exports.defaultFFmpegRecorderManagerOptions = void 0;
var FFmpegRecorder_1 = require("./FFmpegRecorder");
exports.defaultFFmpegRecorderManagerOptions = {
    autoRemoveAfterStopped: false,
};
var FFmpegRecorderManager = /** @class */ (function () {
    function FFmpegRecorderManager(options) {
        this.recorders = {};
        this._options = __assign(__assign({}, exports.defaultFFmpegRecorderManagerOptions), options);
    }
    FFmpegRecorderManager.prototype.create = function (request, onStateChange) {
        var _this = this;
        var recorderOptions = this
            ._options;
        recorderOptions.onStateChange = function (newState, oldState, sessionInfo) {
            if (sessionInfo) {
                var rec_1 = _this.getRecorderWithReuquest(sessionInfo.id);
                if (rec_1) {
                    rec_1.request.state = newState;
                    if (onStateChange) {
                        onStateChange(rec_1.request, newState);
                    }
                }
            }
        };
        var rec = new FFmpegRecorder_1.FFmpegRecorder(request.url, recorderOptions);
        request.id = rec.id;
        this.recorders[rec.id] = {
            request: request,
            recorder: rec,
        };
        return request;
    };
    FFmpegRecorderManager.prototype.start = function (recorder) {
        var rec = this.getRecorder(recorder);
        if (rec) {
            rec.start();
        }
    };
    FFmpegRecorderManager.prototype.stop = function (recorder) {
        var rec = this.getRecorder(recorder);
        if (rec) {
            rec.stop();
        }
    };
    FFmpegRecorderManager.prototype.pause = function (recorder) {
        var rec = this.getRecorder(recorder);
        if (rec) {
            rec.pause();
        }
    };
    FFmpegRecorderManager.prototype.remove = function (recorder) {
        var rec = this.getRecorderWithReuquest(recorder);
        if (rec && rec.request.id) {
            this.recorders[rec.request.id] = undefined;
        }
    };
    FFmpegRecorderManager.prototype.getRecorderWithReuquest = function (recorder) {
        var rec;
        if (typeof recorder === 'string' || recorder instanceof String) {
            rec = this.recorders[recorder];
        }
        else if (recorder.id) {
            rec = this.recorders[recorder.id];
        }
        return rec;
    };
    FFmpegRecorderManager.prototype.getRecorder = function (recorder) {
        var _a;
        return (_a = this.getRecorderWithReuquest(recorder)) === null || _a === void 0 ? void 0 : _a.recorder;
    };
    FFmpegRecorderManager.prototype.getReuqestItem = function (recorder) {
        var _a;
        return (_a = this.getRecorderWithReuquest(recorder)) === null || _a === void 0 ? void 0 : _a.request;
    };
    FFmpegRecorderManager.prototype.getRequestItems = function () {
        return this.getRecorderWithRequestItems().map(function (i) { return i.request; });
    };
    FFmpegRecorderManager.prototype.getRecorderItems = function () {
        return this.getRecorderWithRequestItems().map(function (i) { return i.recorder; });
    };
    FFmpegRecorderManager.prototype.getRecorderWithRequestItems = function () {
        var items = [];
        for (var key in this.recorders) {
            var rec = this.getRecorderWithReuquest(key);
            if (rec) {
                items.push(rec);
            }
        }
        return items;
    };
    FFmpegRecorderManager.prototype.existsRecorder = function (recorder) {
        return this.getRecorderWithReuquest(recorder) !== undefined;
    };
    return FFmpegRecorderManager;
}());
exports.FFmpegRecorderManager = FFmpegRecorderManager;
