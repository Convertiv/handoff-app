"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scssTypesTransformer = void 0;
var colors_1 = __importStar(require("./design/colors"));
var effects_1 = __importStar(require("./design/effects"));
var typography_1 = __importStar(require("./design/typography"));
var component_1 = require("./component");
var utils_1 = require("../utils");
var component_2 = require("../css/component");
/**
 * Build a set of Component types to use as a set of SCSS vars
 * @param documentationObject
 * @returns
 */
function scssTypesTransformer(documentationObject, integrationObject) {
    var _a;
    var components = {};
    for (var componentId in documentationObject.components) {
        components[componentId] = (0, component_1.transformComponentsToScssTypes)(componentId, documentationObject.components[componentId], (_a = integrationObject === null || integrationObject === void 0 ? void 0 : integrationObject.options[componentId]) !== null && _a !== void 0 ? _a : integrationObject === null || integrationObject === void 0 ? void 0 : integrationObject.options['*']);
    }
    var design = {
        colors: (0, colors_1.transformColorTypes)(documentationObject.design.color),
        effects: (0, effects_1.transformEffectTypes)(documentationObject.design.effect),
        typography: (0, typography_1.transformTypographyTypes)(documentationObject.design.typography),
    };
    return { components: components, design: design };
}
exports.scssTypesTransformer = scssTypesTransformer;
/**
 * Transform all the components to scss
 * @param documentationObject
 * @returns
 */
function scssTransformer(documentationObject, integrationObject) {
    var components = {};
    var _loop_1 = function (componentId) {
        components[componentId] = documentationObject.components[componentId].instances
            .map(function (instance) {
            var _a;
            return [
                (0, utils_1.formatComponentCodeBlockComment)(instance, '//'),
                (0, component_1.transformComponentTokensToScssVariables)(instance, (_a = integrationObject === null || integrationObject === void 0 ? void 0 : integrationObject.options[componentId]) !== null && _a !== void 0 ? _a : integrationObject === null || integrationObject === void 0 ? void 0 : integrationObject.options['*'])
                    .map(function (token) { return "\t".concat(token.name, ": ").concat((0, component_2.tokenReferenceFormat)(token, 'scss'), ";"); })
                    .join('\n'),
            ].join('\n');
        })
            .join('\n\n');
    };
    for (var componentId in documentationObject.components) {
        _loop_1(componentId);
    }
    var design = {
        colors: (0, colors_1.default)(documentationObject.design.color),
        typography: (0, typography_1.default)(documentationObject.design.typography),
        effects: (0, effects_1.default)(documentationObject.design.effect),
    };
    return { components: components, design: design };
}
exports.default = scssTransformer;
