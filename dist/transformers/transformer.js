"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transform = void 0;
const utils_1 = require("./utils");
const tokens_1 = require("./tokens");
/**
 * Performs the transformation of the component tokens.
 * @param component
 * @param options
 * @returns
 */
const transform = (tokenType, component, options) => {
    let tokens = [];
    for (const part in component.parts) {
        const tokenSets = component.parts[part];
        if (!tokenSets || tokenSets.length === 0) {
            continue;
        }
        tokenSets.forEach((tokenSet) => {
            return tokens.push(...transformTokens((0, tokens_1.getTokenSetTokens)(tokenSet), tokenType, component, part, options, tokenSet.reference));
        });
    }
    return tokens;
};
exports.transform = transform;
const transformTokens = (tokens, tokenType, component, part, options, reference) => {
    return tokens
        ? Object.entries(tokens).map(([cssProperty, value]) => ({
            name: (0, utils_1.formatTokenName)(tokenType, component.name, component.variantProperties, part, cssProperty, options),
            value: value instanceof Array ? value[0] : value,
            metadata: {
                part,
                cssProperty,
                reference,
                isSupportedCssProperty: value instanceof Array ? value[1] : true,
                nameSegments: (0, utils_1.getTokenNameSegments)(component.name, component.variantProperties, part, cssProperty, options),
            },
        }))
        : [];
};
