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
exports.transformComponentTokensToCssVariables = exports.transformComponentsToCssVariables = void 0;
var utils_1 = require("../utils");
var tokenSetTransformers_1 = require("../tokenSetTransformers");
/**
 * Map down to a variable object
 * @param alerts
 * @returns
 */
var transformComponentsToCssVariables = function (componentName, components, options) {
    var _a;
    var lines = [];
    var componentCssClass = (_a = options === null || options === void 0 ? void 0 : options.rootCssClass) !== null && _a !== void 0 ? _a : componentName;
    lines.push(".".concat(componentCssClass, " {"));
    var cssVars = components.map(function (component) { return "\t".concat((0, utils_1.formatComponentCodeBlockComment)(componentName, component, '/**/'), "\n").concat(Object.entries((0, exports.transformComponentTokensToCssVariables)(component, options))
        .map(function (_a) {
        var variable = _a[0], value = _a[1];
        return "\t".concat(variable, ": ").concat(value.value, ";");
    })
        .join('\n')); });
    return lines.concat(cssVars).join('\n\n') + '\n}\n';
};
exports.transformComponentsToCssVariables = transformComponentsToCssVariables;
/**
 * Generate a list of css variables
 * @param tokens
 * @returns
 */
var transformComponentTokensToCssVariables = function (component, options) {
    var result = {};
    for (var part in component.parts) {
        var tokenSets = component.parts[part];
        if (!tokenSets || tokenSets.length === 0) {
            continue;
        }
        for (var _i = 0, tokenSets_1 = tokenSets; _i < tokenSets_1.length; _i++) {
            var tokenSet = tokenSets_1[_i];
            var transformer = (0, tokenSetTransformers_1.getTokenSetTransformer)(tokenSet);
            if (!transformer) {
                continue;
            }
            result = __assign(__assign({}, result), transformer('css', component, part, tokenSet, options));
        }
    }
    return result;
};
exports.transformComponentTokensToCssVariables = transformComponentTokensToCssVariables;
