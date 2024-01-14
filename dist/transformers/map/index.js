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
function mapTransformer(documentationObject) {
    var flatMap = {};
    var components = {};
    for (var componentId in documentationObject.components) {
        var map = (0, component_1.transformComponentsToMap)(componentId, documentationObject.components[componentId]);
        components[componentId] = JSON.stringify(map, null, 2);
        flatMap = __assign(__assign({}, flatMap), map);
    }
    var colors = (0, colors_1.default)(documentationObject.design.color);
    var typography = (0, typography_1.default)(documentationObject.design.typography);
    var effects = (0, effects_1.default)(documentationObject.design.effect);
    flatMap = __assign(__assign(__assign(__assign({}, flatMap), colors), typography), effects);
    return {
        components: components,
        design: {
            colors: JSON.stringify(colors, null, 2),
            typography: JSON.stringify(typography, null, 2),
            effects: JSON.stringify(effects, null, 2),
        },
        attachments: {
            "tokens-map": JSON.stringify(flatMap, null, 2),
        }
    };
}
exports.default = mapTransformer;
