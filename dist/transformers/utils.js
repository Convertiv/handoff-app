import capitalize from "lodash/capitalize.js";
/**
 * Generate a comment block at the top of each record
 * @param type
 * @param component
 * @returns
 */
export var formatComponentCodeBlockComment = function (type, component, format) {
    var str = type;
    if (component.componentType === 'design') {
        str = (component.type !== undefined) ? "".concat(capitalize(component.type), " ").concat(str) : "".concat(capitalize(str));
        str += (component.theme !== undefined) ? ", theme: ".concat(component.theme) : "";
        str += (component.state !== undefined) ? ", state: ".concat(component.state) : "";
        str += (component.activity !== undefined) ? ", activity: ".concat(component.activity) : "";
    }
    if (component.componentType === 'layout') {
        str = "".concat(capitalize(str));
        str += (component.layout !== undefined) ? ", layout: ".concat(component.layout) : "";
        str += (component.size !== undefined) ? ", size: ".concat(component.size) : "";
    }
    return format === "/**/" ? "/* ".concat(str, " */") : "// ".concat(str);
};
export var formatVariableName = function (variableType, component, part, property, options) {
    var _a = getReducedVariableNameTokens(component, options), theme = _a.theme, type = _a.type, state = _a.state;
    var variableNameTemplate = variableType === 'css' ? options === null || options === void 0 ? void 0 : options.cssVariableTemplate : options === null || options === void 0 ? void 0 : options.scssVariableTemplate;
    var variableName = variableNameTemplate
        ? parseVariableNameTemplate(variableNameTemplate, component, part, property, options)
        : [
            component.name,
            type,
            normalizeVariablePart(part),
            theme,
            state,
            property,
        ].filter(Boolean).join('-');
    return variableType === 'css' ? "--".concat(variableName) : "$".concat(variableName);
};
export var normalizeVariableToken = function (token, val, options) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
    if (token in ((_a = options === null || options === void 0 ? void 0 : options.replace) !== null && _a !== void 0 ? _a : {}) && val && val in ((_b = options === null || options === void 0 ? void 0 : options.replace[token]) !== null && _b !== void 0 ? _b : {})) {
        return (_c = options === null || options === void 0 ? void 0 : options.replace[token][val]) !== null && _c !== void 0 ? _c : '';
    }
    if (token === 'theme' && val === ((_e = (_d = options === null || options === void 0 ? void 0 : options.defaults) === null || _d === void 0 ? void 0 : _d.theme) !== null && _e !== void 0 ? _e : '')) {
        return '';
    }
    if (token === 'type' && val === ((_g = (_f = options === null || options === void 0 ? void 0 : options.defaults) === null || _f === void 0 ? void 0 : _f.type) !== null && _g !== void 0 ? _g : '')) {
        return '';
    }
    if (token === 'state' && val === ((_j = (_h = options === null || options === void 0 ? void 0 : options.defaults) === null || _h === void 0 ? void 0 : _h.state) !== null && _j !== void 0 ? _j : '')) {
        return '';
    }
    if (token === 'activity' && val === ((_l = (_k = options === null || options === void 0 ? void 0 : options.defaults) === null || _k === void 0 ? void 0 : _k.activity) !== null && _l !== void 0 ? _l : '')) {
        return '';
    }
    if (token === 'layout' && val === ((_o = (_m = options === null || options === void 0 ? void 0 : options.defaults) === null || _m === void 0 ? void 0 : _m.layout) !== null && _o !== void 0 ? _o : '')) {
        return '';
    }
    if (token === 'size' && val === ((_q = (_p = options === null || options === void 0 ? void 0 : options.defaults) === null || _p === void 0 ? void 0 : _p.size) !== null && _q !== void 0 ? _q : '')) {
        return '';
    }
    return val;
};
export var normalizeVariablePart = function (part) {
    return part === '$' ? '' : part.replace(/[A-Z]/g, function (m) { return "-" + m.toLowerCase(); });
};
var getReducedVariableNameTokens = function (component, options) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    var theme = component.componentType === 'design' ? normalizeVariableToken('theme', ((_a = component.theme) !== null && _a !== void 0 ? _a : ''), options) : undefined;
    var state = component.componentType === 'design'
        ? (_c = normalizeVariableToken('activity', ((_b = component.activity) !== null && _b !== void 0 ? _b : undefined), options)) !== null && _c !== void 0 ? _c : normalizeVariableToken('state', ((_d = component.state) !== null && _d !== void 0 ? _d : undefined), options)
        : undefined;
    var type = component.componentType === 'design'
        ? (state && state === normalizeVariableToken('activity', ((_e = component.activity) !== null && _e !== void 0 ? _e : ''), options) ? normalizeVariableToken('state', ((_f = component.state) !== null && _f !== void 0 ? _f : ''), options) : normalizeVariableToken('type', ((_g = component.type) !== null && _g !== void 0 ? _g : ''), options))
        : (_j = normalizeVariableToken('layout', ((_h = component.layout) !== null && _h !== void 0 ? _h : undefined), options)) !== null && _j !== void 0 ? _j : normalizeVariableToken('size', ((_k = component.size) !== null && _k !== void 0 ? _k : undefined), options);
    return { theme: theme, type: type, state: state };
};
var parseVariableNameTemplate = function (template, component, part, property, options) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    return template
        .replaceAll('{$theme}', component.componentType === 'design' ? (_b = normalizeVariableToken('theme', ((_a = component.theme) !== null && _a !== void 0 ? _a : ''), options)) !== null && _b !== void 0 ? _b : '' : '')
        .replaceAll('{$type}', component.componentType === 'design' ? (_d = normalizeVariableToken('type', ((_c = component.type) !== null && _c !== void 0 ? _c : ''), options)) !== null && _d !== void 0 ? _d : '' : '')
        .replaceAll('{$state}', component.componentType === 'design' ? (_f = normalizeVariableToken('state', ((_e = component.state) !== null && _e !== void 0 ? _e : ''), options)) !== null && _f !== void 0 ? _f : '' : '')
        .replaceAll('{$activity}', component.componentType === 'design' ? (_h = normalizeVariableToken('activity', ((_g = component.activity) !== null && _g !== void 0 ? _g : ''), options)) !== null && _h !== void 0 ? _h : '' : '')
        .replaceAll('{$layout}', component.componentType === 'layout' ? (_k = normalizeVariableToken('layout', ((_j = component.layout) !== null && _j !== void 0 ? _j : ''), options)) !== null && _k !== void 0 ? _k : '' : '')
        .replaceAll('{$size}', component.componentType === 'layout' ? (_m = normalizeVariableToken('size', ((_l = component.size) !== null && _l !== void 0 ? _l : ''), options)) !== null && _m !== void 0 ? _m : '' : '')
        .replaceAll('{$part}', normalizeVariablePart(part))
        .replaceAll('{$property}', property)
        .replace(/-+/g, '-');
};
