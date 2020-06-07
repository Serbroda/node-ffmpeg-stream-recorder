"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FFmpegRecorderState = void 0;
var FFmpegRecorderState;
(function (FFmpegRecorderState) {
    FFmpegRecorderState["INITIAL"] = "INITIAL";
    FFmpegRecorderState["RECORDING"] = "RECORDING";
    FFmpegRecorderState["PAUSED"] = "PAUSED";
    FFmpegRecorderState["STOPPING"] = "STOPPING";
    FFmpegRecorderState["CREATINGOUTFILE"] = "CREATINGOUTFILE";
    FFmpegRecorderState["CLEANING"] = "CLEANING";
    FFmpegRecorderState["FINISH"] = "FINISH";
})(FFmpegRecorderState = exports.FFmpegRecorderState || (exports.FFmpegRecorderState = {}));
