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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var component_1 = require("./component");
var colors_1 = __importDefault(require("./design/colors"));
var effects_1 = __importDefault(require("./design/effects"));
var typography_1 = __importDefault(require("./design/typography"));
function mapTransformer(documentationObject, options) {
    var components = {};
    for (var componentId in documentationObject.components) {
        components[componentId] = (0, component_1.transformComponentsToMap)(componentId, documentationObject.components[componentId], options === null || options === void 0 ? void 0 : options.get(componentId));
    }
    // Create a single file containing all components with their respective tokens
    components['_tokens-map'] = JSON.stringify(Object.values(components).reduce(function (res, val) {
        return __assign(__assign({}, res), JSON.parse(val));
    }, {}), null, 2);
    var design = {
        colors: (0, colors_1.default)(documentationObject.design.color),
        typography: (0, typography_1.default)(documentationObject.design.typography),
        effects: (0, effects_1.default)(documentationObject.design.effect),
    };
    return {
        components: components,
        design: design,
    };
}
exports.default = mapTransformer;
