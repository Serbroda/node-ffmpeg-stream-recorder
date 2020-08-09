"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var path = __importStar(require("path"));
var Recorder_1 = require("./services/Recorder");
var ThreadingHelper_1 = require("./helpers/ThreadingHelper");
console.log('Args', process.argv);
if (process.argv.length > 2) {
    console.log('run');
    var url = 'https://edge86.stream.highwebmedia.com/live-hls/amlst:naughtyelle-sd-247f6f749ab28d8f4c01cebd997b152b990c8cdeb2d965eb2320f06def691577_trns_h264/playlist.m3u8';
    var outfile = path.join(process.cwd(), 'out', "output.mp4");
    var recorder_1 = new Recorder_1.Recorder();
    recorder_1.start(url, outfile, { timestamp: true }).then(function (res) { return console.log('Download finished', res); });
    ThreadingHelper_1.sleepAsync(10000).then(function () {
        recorder_1.stop();
    });
}
