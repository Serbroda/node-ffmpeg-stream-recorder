"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Delayed = void 0;
var ThreadingHelper_1 = require("./ThreadingHelper");
function Delayed(millis) {
    return function (target, propertyKey, descriptor) {
        var originalMethod = descriptor.value;
        descriptor.value = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            ThreadingHelper_1.sleep(millis);
            var result = originalMethod.apply(this, args);
            return result;
        };
    };
}
exports.Delayed = Delayed;
