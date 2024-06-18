import { replaceTokens } from "../utils/index";
import { capitalize } from "lodash";
/**
 * Returns normalized type name
 * @param type
 * @returns
 */
export var getTypeName = function (type) { return type.group
    ? "".concat(type.group, "-").concat(type.machine_name)
    : "".concat(type.machine_name); };
/**
 * Generates a standardized component comment block.
 * @param type
 * @param component
 * @returns
 */
export var formatComponentCodeBlockComment = function (component, format) {
    var parts = [capitalize(component.name)];
    component.variantProperties.forEach(function (_a) {
        var variantProp = _a[0], val = _a[1];
        parts.push("".concat(variantProp.toLowerCase(), ": ").concat(val));
    });
    var str = parts.join(', ');
    return format === "/**/" ? "/* ".concat(str, " */") : "// ".concat(str);
};
/**
 * Formats the component token name for the given token type
 * @param tokenType
 * @param component
 * @param part
 * @param property
 * @param options
 * @returns
 */
export var formatTokenName = function (tokenType, component, part, property, options) {
    var prefix = tokenType === 'css' ? '--' : tokenType === 'scss' ? '$' : '';
    var tokenNameParts = getTokenNameSegments(component, part, property, options);
    return "".concat(prefix).concat(tokenNameParts.join('-'));
};
/**
 * Returns the token name segments
 * @param component
 * @param options
 * @returns
 */
export var getTokenNameSegments = function (component, part, property, options) {
    if (options === null || options === void 0 ? void 0 : options.transformer.tokenNameSegments) {
        return options.transformer.tokenNameSegments
            .map(function (tokenNamePart) {
            var initialValue = tokenNamePart;
            tokenNamePart = replaceTokens(tokenNamePart, new Map([
                ['Component', component.name],
                ['Part', normalizeComponentPartName(part)],
                ['Property', property],
            ]), function (token, _, value) { return (value === '' ? token : value); });
            tokenNamePart = replaceTokens(tokenNamePart, new Map(component.variantProperties.map(function (_a) {
                var k = _a[0], v = _a[1];
                return ['Variant.' + k, v];
            })), function (_, variantProp, value) { return normalizeTokenNamePartValue(variantProp.replace('Variant.', ''), value, options); });
            // Backward compatibility (remove before 1.0 release)
            if (tokenNamePart === '') {
                tokenNamePart = replaceTokens(initialValue, new Map(component.variantProperties), function (_, variantProp, value) {
                    return normalizeTokenNamePartValue(variantProp, value, options);
                });
            }
            return tokenNamePart;
        })
            .filter(function (part) { return part !== ''; });
    }
    var parts = [
        component.name,
        normalizeComponentPartName(part)
    ];
    component.variantProperties.forEach(function (_a) {
        var variantProp = _a[0], value = _a[1];
        parts.push(normalizeTokenNamePartValue(variantProp, value, options));
    });
    parts.push(property);
    return parts.filter(function (part) { return part !== ''; });
};
/**
 * Normalizes the token name variable (specifier) by considering if the value should be replaced
 * with some other value based replace rules defined in the transformer options of the component
 * or removed entirely (replaced with empty string) if the value matches the default value
 * defined in the component shared options (assuming keepDefaults is set to false).
 * @param variable
 * @param value
 * @param options
 * @returns
 */
export var normalizeTokenNamePartValue = function (variable, value, options, keepDefaults) {
    var _a, _b, _c, _d, _e;
    if (keepDefaults === void 0) { keepDefaults = false; }
    var replace = (_a = options === null || options === void 0 ? void 0 : options.transformer.replace) !== null && _a !== void 0 ? _a : {};
    var defaults = (_b = options === null || options === void 0 ? void 0 : options.shared.defaults) !== null && _b !== void 0 ? _b : {};
    if (variable in (replace !== null && replace !== void 0 ? replace : {}) && value && value in ((_c = replace[variable]) !== null && _c !== void 0 ? _c : {})) {
        return (_d = replace[variable][value]) !== null && _d !== void 0 ? _d : '';
    }
    if (!keepDefaults && variable in (defaults !== null && defaults !== void 0 ? defaults : {}) && value === ((_e = defaults[variable]) !== null && _e !== void 0 ? _e : '')) {
        return '';
    }
    return value;
};
/**
 * Returns the normalized part name.
 * @param part
 * @returns
 */
var normalizeComponentPartName = function (part) {
    return part === '$' ? '' : part.replace(/[A-Z]/g, function (m) { return "-" + m.toLowerCase(); });
};
