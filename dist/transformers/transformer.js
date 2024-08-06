"use strict";
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
    var tokens = [];
    var _loop_1 = function (part) {
        var tokenSets = component.parts[part];
        if (!tokenSets || tokenSets.length === 0) {
            return "continue";
        }
        tokenSets.forEach(function (tokenSet) {
            return tokens.push.apply(tokens, transformTokens((0, tokens_1.getTokenSetTokens)(tokenSet), tokenType, component, part, options));
        });
    };
    for (var part in component.parts) {
        _loop_1(part);
    }
    return tokens;
};
exports.transform = transform;
var transformTokens = function (tokens, tokenType, component, part, options) {
    return tokens
        ? Object.entries(tokens).map(function (_a) {
            var cssProperty = _a[0], value = _a[1];
            return ({
                name: (0, utils_1.formatTokenName)(tokenType, component.name, component.variantProperties, part, cssProperty, options),
                value: value instanceof Array ? value[0] : value,
                metadata: {
                    part: part,
                    cssProperty: cssProperty,
                    isSupportedCssProperty: value instanceof Array ? value[1] : true,
                    nameSegments: (0, utils_1.getTokenNameSegments)(component.name, component.variantProperties, part, cssProperty, options),
                },
            });
        })
        : [];
};
