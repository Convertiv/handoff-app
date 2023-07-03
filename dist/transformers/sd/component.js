"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformComponentsToStyleDictionary = void 0;
var utils_1 = require("../utils");
/**
 * Transforms the component tokens into a style dictionary
 * @param alerts
 * @returns
 */
var transformComponentsToStyleDictionary = function (_, components, options) {
    var sd = {};
    var tokenNamePartSeparator = '//'; // TODO: Temp
    components.forEach(function (component) {
        Object.entries((0, utils_1.transformComponentTokens)(component, options)).forEach(function (_a) {
            var tokenName = _a[0], tokenValue = _a[1];
            var path = tokenName.split(tokenNamePartSeparator); // TODO: Improve/remove by returning the property name structure?
            var lastIdx = path.length - 1;
            var ref = sd;
            path.forEach(function (el, idx) {
                var _a;
                if (idx === lastIdx) {
                    return;
                }
                (_a = ref[el]) !== null && _a !== void 0 ? _a : (ref[el] = {});
                ref = ref[el];
            });
            var propParts = path[lastIdx].split('-');
            propParts.forEach(function (el) {
                var _a;
                (_a = ref[el]) !== null && _a !== void 0 ? _a : (ref[el] = {});
                ref = ref[el];
            });
            ref['value'] = tokenValue.value;
        });
    });
    return JSON.stringify(sd, null, 2);
};
exports.transformComponentsToStyleDictionary = transformComponentsToStyleDictionary;
