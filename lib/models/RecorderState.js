"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecorderState = void 0;
var RecorderState;
(function (RecorderState) {
    RecorderState["INITIAL"] = "INITIAL";
    RecorderState["RECORDING"] = "RECORDING";
    RecorderState["STOPPED"] = "STOPPED";
    RecorderState["FINISHING"] = "FINISHING";
    RecorderState["SUCCESS"] = "SUCCESS";
    RecorderState["EXITED_ABNORMALLY"] = "EXITED_ABNORMALLY";
    RecorderState["ERROR"] = "ERROR";
})(RecorderState = exports.RecorderState || (exports.RecorderState = {}));
