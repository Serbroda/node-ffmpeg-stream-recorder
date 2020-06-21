"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecorderState = void 0;
var RecorderState;
(function (RecorderState) {
    RecorderState["INITIAL"] = "INITIAL";
    RecorderState["RECORDING"] = "RECORDING";
    RecorderState["PAUSED"] = "PAUSED";
    RecorderState["STOPPING"] = "STOPPING";
    RecorderState["CREATINGOUTFILE"] = "CREATINGOUTFILE";
    RecorderState["CLEANING"] = "CLEANING";
    RecorderState["COMPLETED"] = "COMPLETED";
    RecorderState["PROCESS_EXITED_ABNORMALLY"] = "PROCESS_EXITED_ABNORMALLY";
    RecorderState["ERROR"] = "ERROR";
    RecorderState["WAITING_IN_QUEUE"] = "WAITING_IN_QUEUE";
})(RecorderState = exports.RecorderState || (exports.RecorderState = {}));
