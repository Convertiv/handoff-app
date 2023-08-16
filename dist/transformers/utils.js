"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeTokenNamePartValue = exports.getTokenNameSegments = exports.formatTokenName = exports.formatComponentCodeBlockComment = exports.getTypeName = void 0;
var index_1 = require("../utils/index");
var lodash_1 = require("lodash");
/**
 * Returns normalized type name
 * @param type
 * @returns
 */
var getTypeName = function (type) { return type.group
    ? "".concat(type.group, "-").concat(type.machine_name)
    : "".concat(type.machine_name); };
exports.getTypeName = getTypeName;
/**
 * Generates a standardized component comment block.
 * @param type
 * @param component
 * @returns
 */
var formatComponentCodeBlockComment = function (component, format) {
    var parts = [(0, lodash_1.capitalize)(component.name)];
    component.variantProperties.forEach(function (_a) {
        var variantProp = _a[0], val = _a[1];
        parts.push("".concat(variantProp.toLowerCase(), ": ").concat(val));
    });
    var str = parts.join(', ');
    return format === "/**/" ? "/* ".concat(str, " */") : "// ".concat(str);
};
exports.formatComponentCodeBlockComment = formatComponentCodeBlockComment;
/**
 * Formats the component token name for the given token type
 * @param tokenType
 * @param component
 * @param part
 * @param property
 * @param options
 * @returns
 */
var formatTokenName = function (tokenType, component, part, property, options) {
    var prefix = tokenType === 'css' ? '--' : tokenType === 'scss' ? '$' : '';
    var tokenNameParts = (0, exports.getTokenNameSegments)(component, part, property, options);
    return "".concat(prefix).concat(tokenNameParts.join('-'));
};
exports.formatTokenName = formatTokenName;
/**
 * Returns the token name segments
 * @param component
 * @param options
 * @returns
 */
var getTokenNameSegments = function (component, part, property, options) {
    if (options === null || options === void 0 ? void 0 : options.tokenNameSegments) {
        return options.tokenNameSegments.map(function (tokenNamePart) {
            tokenNamePart = (0, index_1.replaceTokens)(tokenNamePart, new Map([['Component', component.name], ['Part', normalizeComponentPartName(part)], ['Property', property]]), function (token, _, value) { return value === '' ? token : value; });
            tokenNamePart = (0, index_1.replaceTokens)(tokenNamePart, new Map(component.variantProperties), function (_, variantProp, value) { return (0, exports.normalizeTokenNamePartValue)(variantProp, value, options); });
            return tokenNamePart;
        }).filter(function (part) { return part !== ''; });
    }
    var parts = [
        component.name,
        normalizeComponentPartName(part)
    ];
    component.variantProperties.forEach(function (_a) {
        var variantProp = _a[0], value = _a[1];
        parts.push((0, exports.normalizeTokenNamePartValue)(variantProp, value, options));
    });
    parts.push(property);
    return parts.filter(function (part) { return part !== ''; });
};
exports.getTokenNameSegments = getTokenNameSegments;
/**
 * Normalizes the token name variable (specifier) by considering if the value should be replaced
 * with some other value based replace rules defined in the transformer options of the exportable
 * or removed entirely (replaced with empty string) if the value matches the default value
 * defined in the exportable shared options (assuming keepDefaults is set to false).
 * @param variable
 * @param value
 * @param options
 * @returns
 */
var normalizeTokenNamePartValue = function (variable, value, options, keepDefaults) {
    var _a, _b, _c, _d, _e;
    if (keepDefaults === void 0) { keepDefaults = false; }
    var replace = (_a = options === null || options === void 0 ? void 0 : options.replace) !== null && _a !== void 0 ? _a : {};
    var defaults = (_b = options === null || options === void 0 ? void 0 : options.defaults) !== null && _b !== void 0 ? _b : {};
    if (variable in (replace !== null && replace !== void 0 ? replace : {}) && value && value in ((_c = replace[variable]) !== null && _c !== void 0 ? _c : {})) {
        return (_d = replace[variable][value]) !== null && _d !== void 0 ? _d : '';
    }
    if (!keepDefaults && variable in (defaults !== null && defaults !== void 0 ? defaults : {}) && value === ((_e = defaults[variable]) !== null && _e !== void 0 ? _e : '')) {
        return '';
    }
    return value;
};
exports.normalizeTokenNamePartValue = normalizeTokenNamePartValue;
/**
 * Returns the normalized part name.
 * @param part
 * @returns
 */
var normalizeComponentPartName = function (part) {
    return part === '$' ? '' : part.replace(/[A-Z]/g, function (m) { return "-" + m.toLowerCase(); });
};
