"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeTokenNamePartValue = exports.getTokenNameSegments = exports.formatTokenName = exports.formatComponentCodeBlockComment = exports.getTypeName = void 0;
const index_1 = require("../utils/index");
const lodash_1 = require("lodash");
/**
 * Returns normalized type name
 * @param type
 * @returns
 */
const getTypeName = (type) => type.group
    ? `${type.group}-${type.machine_name}`
    : `${type.machine_name}`;
exports.getTypeName = getTypeName;
/**
 * Generates a standardized component comment block.
 * @param type
 * @param component
 * @returns
 */
const formatComponentCodeBlockComment = (component, format) => {
    const parts = [(0, lodash_1.capitalize)(component.name)];
    component.variantProperties.forEach(([variantProp, val]) => {
        // @ts-ignore
        parts.push(`${variantProp.toLowerCase()}: ${val}`);
    });
    const str = parts.join(', ');
    return format === "/**/" ? `/* ${str} */` : `// ${str}`;
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
const formatTokenName = (tokenType, componentName, componentVariantProps, part, property, options) => {
    const prefix = tokenType === 'css' ? '--' : tokenType === 'scss' ? '$' : '';
    const tokenNameParts = (0, exports.getTokenNameSegments)(componentName, componentVariantProps, part, property, options);
    return `${prefix}${tokenNameParts.join('-')}`;
};
exports.formatTokenName = formatTokenName;
/**
 * Returns the token name segments
 * @param component
 * @param options
 * @returns
 */
const getTokenNameSegments = (componentName, componentVariantProps, part, property, options) => {
    if (options === null || options === void 0 ? void 0 : options.tokenNameSegments) {
        return options.tokenNameSegments
            .map((tokenNamePart) => {
            const initialValue = tokenNamePart;
            tokenNamePart = (0, index_1.replaceTokens)(tokenNamePart, new Map([
                ['component', componentName],
                ['part', normalizeComponentPartName(part)],
                ['property', property],
            ]), (token, _, value) => (value === '' ? token : value));
            tokenNamePart = (0, index_1.replaceTokens)(tokenNamePart, new Map(componentVariantProps.map(([k, v]) => [('Variant.' + k).toLowerCase(), v.toLowerCase()])), (_, variantProp, value) => (0, exports.normalizeTokenNamePartValue)(variantProp.replace('variant.', ''), value, options));
            // Backward compatibility (remove before 1.0 release)
            if (tokenNamePart === '') {
                tokenNamePart = (0, index_1.replaceTokens)(initialValue, new Map(componentVariantProps.map(([k, v]) => [k.toLowerCase(), v.toLowerCase()])), (_, variantProp, value) => (0, exports.normalizeTokenNamePartValue)(variantProp, value, options));
            }
            return tokenNamePart;
        })
            .filter((part) => part !== '');
    }
    const parts = [componentName, normalizeComponentPartName(part)];
    componentVariantProps.forEach(([variantProp, value]) => {
        parts.push((0, exports.normalizeTokenNamePartValue)(variantProp, value, options));
    });
    parts.push(property);
    return parts.filter((part) => part !== '');
};
exports.getTokenNameSegments = getTokenNameSegments;
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
const normalizeTokenNamePartValue = (variable, value, options, keepDefaults = false) => {
    var _a, _b, _c, _d, _e;
    const normalizedVariable = variable.toLowerCase();
    const normalizedValue = value.toLowerCase();
    const replace = (_a = options === null || options === void 0 ? void 0 : options.replace) !== null && _a !== void 0 ? _a : {};
    const defaults = (_b = options === null || options === void 0 ? void 0 : options.defaults) !== null && _b !== void 0 ? _b : {};
    if (normalizedVariable in (replace !== null && replace !== void 0 ? replace : {}) && normalizedValue && normalizedValue in ((_c = replace[normalizedVariable]) !== null && _c !== void 0 ? _c : {})) {
        return (_d = replace[normalizedVariable][normalizedValue]) !== null && _d !== void 0 ? _d : '';
    }
    if (!keepDefaults && normalizedVariable in (defaults !== null && defaults !== void 0 ? defaults : {}) && normalizedValue === ((_e = defaults[normalizedVariable]) !== null && _e !== void 0 ? _e : '')) {
        return '';
    }
    return normalizedValue;
};
exports.normalizeTokenNamePartValue = normalizeTokenNamePartValue;
/**
 * Returns the normalized part name.
 * @param part
 * @returns
 */
const normalizeComponentPartName = (part) => {
    return part === '$' ? '' : part.replace(/[A-Z]/g, m => "-" + m.toLowerCase());
};
