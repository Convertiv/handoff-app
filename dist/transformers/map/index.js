"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const component_1 = require("./component");
const colors_1 = __importDefault(require("./design/colors"));
const effects_1 = __importDefault(require("./design/effects"));
const typography_1 = __importDefault(require("./design/typography"));
function mapTransformer(documentationObject, integrationObject) {
    var _a;
    let flatMap = {};
    const components = {};
    for (const componentId in documentationObject.components) {
        const map = (0, component_1.transformComponentsToMap)(componentId, documentationObject.components[componentId], (_a = integrationObject === null || integrationObject === void 0 ? void 0 : integrationObject.options[componentId]) !== null && _a !== void 0 ? _a : integrationObject === null || integrationObject === void 0 ? void 0 : integrationObject.options['*']);
        components[componentId] = JSON.stringify(map, null, 2);
        flatMap = Object.assign(Object.assign({}, flatMap), map);
    }
    const colors = (0, colors_1.default)(documentationObject.design.color);
    const typography = (0, typography_1.default)(documentationObject.design.typography);
    const effects = (0, effects_1.default)(documentationObject.design.effect);
    flatMap = Object.assign(Object.assign(Object.assign(Object.assign({}, flatMap), colors), typography), effects);
    return {
        components,
        design: {
            colors: JSON.stringify(colors, null, 2),
            typography: JSON.stringify(typography, null, 2),
            effects: JSON.stringify(effects, null, 2),
        },
        attachments: {
            'tokens-map': JSON.stringify(flatMap, null, 2),
        },
    };
}
exports.default = mapTransformer;
