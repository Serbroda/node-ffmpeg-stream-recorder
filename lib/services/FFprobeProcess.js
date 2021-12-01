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
exports.FFprobeProcess = void 0;
var child_process_1 = require("child_process");
var encoding = 'utf8';
var FFprobeProcess = /** @class */ (function () {
    function FFprobeProcess() {
        this._childProcess = null;
    }
    FFprobeProcess.prototype.exec = function (args, options) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var opt = __assign({ cwd: __dirname }, options);
            _this._childProcess = child_process_1.spawn('ffprobe', args, {
                cwd: opt.cwd,
            });
            _this._childProcess.stdin.setDefaultEncoding(encoding);
            _this._childProcess.stdout.setEncoding(encoding);
            _this._childProcess.stderr.setEncoding(encoding);
            var result = '';
            _this._childProcess.stdin.on('data', function (data) { return (result = result + _this.parseMessage(data)); });
            _this._childProcess.stdout.on('data', function (data) { return (result = result + _this.parseMessage(data)); });
            _this._childProcess.stderr.on('data', function (data) { return (result = result + _this.parseMessage(data)); });
            _this._childProcess.once('close', function (code, signal) {
                resolve(result);
            });
        });
    };
    FFprobeProcess.prototype.parseMessage = function (data) {
        var str = data.toString();
        var lines = str.split(/(\r?\n)/g);
        var msg = lines.join('');
        return msg;
    };
    return FFprobeProcess;
}());
exports.FFprobeProcess = FFprobeProcess;
