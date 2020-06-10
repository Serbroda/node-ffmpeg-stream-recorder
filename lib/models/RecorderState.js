"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecorderState = void 0;
var RecorderState;
(function (RecorderState) {
    RecorderState["INITIAL"] = "INITIAL";
    RecorderState["RECORDING"] = "RECORDING";
    RecorderState["PAUSED"] = "PAUSED";
    RecorderState["STOPPING"] = "STOPPING";
    RecorderState["EXITED_ABNORMALLY"] = "EXITED_ABNORMALLY";
    RecorderState["CREATINGOUTFILE"] = "CREATINGOUTFILE";
    RecorderState["CLEANING"] = "CLEANING";
    RecorderState["FINISH"] = "FINISH";
})(RecorderState = exports.RecorderState || (exports.RecorderState = {}));
