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
exports.transform = void 0;
var utils_1 = require("./utils");
var tokens_1 = require("./tokens");
/**
 * Performs the transformation of the component tokens.
 * @param component
 * @param options
 * @returns
 */
var transform = function (tokenType, component, options) {
    var result = {};
    for (var part in component.parts) {
        var tokenSets = component.parts[part];
        if (!tokenSets || tokenSets.length === 0) {
            continue;
        }
        for (var _i = 0, tokenSets_1 = tokenSets; _i < tokenSets_1.length; _i++) {
            var tokenSet = tokenSets_1[_i];
            var tokens = (0, tokens_1.getTokenSetTokens)(tokenSet);
            result = __assign(__assign({}, result), transformTokens(tokens, tokenType, component, part, options));
        }
    }
    return result;
};
exports.transform = transform;
var transformTokens = function (tokens, tokenType, component, part, options) {
    return tokens ? Object.entries(tokens).reduce(function (record, _a) {
        var _b;
        var property = _a[0], value = _a[1];
        return (__assign(__assign({}, record), (_b = {}, _b[(0, utils_1.formatTokenName)(tokenType, component, part, property, options)] = {
            value: value instanceof Array ? value[0] : value,
            property: property,
            part: part,
            metadata: {
                propertyPath: (0, utils_1.getTokenNameSegments)(component, part, property, options),
                isSupportedCssProperty: value instanceof Array ? value[1] : true
            }
        }, _b)));
    }, {}) : {};
};
