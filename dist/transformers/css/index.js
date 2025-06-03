"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const component_1 = require("./component");
const colors_1 = __importDefault(require("./design/colors"));
const effects_1 = __importDefault(require("./design/effects"));
const typography_1 = __importDefault(require("./design/typography"));
function cssTransformer(documentationObject, handoff, integrationObject) {
    var _a;
    const components = {};
    for (const componentId in documentationObject.components) {
        components[componentId] = (0, component_1.transformComponentsToCssVariables)(componentId, documentationObject.components[componentId], (_a = integrationObject === null || integrationObject === void 0 ? void 0 : integrationObject.options[componentId]) !== null && _a !== void 0 ? _a : integrationObject === null || integrationObject === void 0 ? void 0 : integrationObject.options['*'], handoff);
    }
    const design = {
        colors: (0, colors_1.default)(documentationObject.design.color),
        typography: (0, typography_1.default)(documentationObject.design.typography),
        effects: (0, effects_1.default)(documentationObject.design.effect),
    };
    return {
        components,
        design,
    };
}
exports.default = cssTransformer;
