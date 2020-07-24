"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ofType = void 0;
exports.ofType = function (obj, instance) {
    if (!obj) {
        return false;
    }
    return obj instanceof instance;
};
