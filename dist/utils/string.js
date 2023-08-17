"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.replaceTokens = void 0;
function replaceTokens(str, tokenValMap, pipe) {
    return str.replace(/\$\{(.*?)\}/g, function (token) {
        var _a;
        var key = token.substring(2, token.length - 1);
        var val = (_a = tokenValMap.get(key)) !== null && _a !== void 0 ? _a : '';
        return pipe ? pipe(token, key, val) : val;
    });
}
exports.replaceTokens = replaceTokens;
