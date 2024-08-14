"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var component_1 = require("./component");
var colors_1 = __importDefault(require("./design/colors"));
var effects_1 = __importDefault(require("./design/effects"));
var typography_1 = __importDefault(require("./design/typography"));
function cssTransformer(documentationObject, integrationObject) {
    var components = {};
    for (var componentId in documentationObject.components) {
        components[componentId] = (0, component_1.transformComponentsToCssVariables)(componentId, documentationObject.components[componentId], integrationObject.options[componentId]);
    }
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
exports.default = cssTransformer;
