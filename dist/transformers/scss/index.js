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
const colors_1 = __importStar(require("./design/colors"));
const effects_1 = __importStar(require("./design/effects"));
const typography_1 = __importStar(require("./design/typography"));
const component_1 = require("./component");
const utils_1 = require("../utils");
const component_2 = require("../css/component");
/**
 * Build a set of Component types to use as a set of SCSS vars
 * @param documentationObject
 * @returns
 */
function scssTypesTransformer(documentationObject, integrationObject) {
    var _a;
    const components = {};
    for (const componentId in documentationObject.components) {
        components[componentId] = (0, component_1.transformComponentsToScssTypes)(componentId, documentationObject.components[componentId], (_a = integrationObject === null || integrationObject === void 0 ? void 0 : integrationObject.options[componentId]) !== null && _a !== void 0 ? _a : integrationObject === null || integrationObject === void 0 ? void 0 : integrationObject.options['*']);
    }
    const design = {
        colors: (0, colors_1.transformColorTypes)(documentationObject.design.color),
        effects: (0, effects_1.transformEffectTypes)(documentationObject.design.effect),
        typography: (0, typography_1.transformTypographyTypes)(documentationObject.design.typography),
    };
    return { components, design };
}
exports.scssTypesTransformer = scssTypesTransformer;
/**
 * Transform all the components to scss
 * @param documentationObject
 * @returns
 */
function scssTransformer(documentationObject, handoff, integrationObject) {
    const components = {};
    for (const componentId in documentationObject.components) {
        components[componentId] = documentationObject.components[componentId].instances
            .map((instance) => {
            var _a;
            return [
                (0, utils_1.formatComponentCodeBlockComment)(instance, '//'),
                (0, component_1.transformComponentTokensToScssVariables)(instance, (_a = integrationObject === null || integrationObject === void 0 ? void 0 : integrationObject.options[componentId]) !== null && _a !== void 0 ? _a : integrationObject === null || integrationObject === void 0 ? void 0 : integrationObject.options['*'])
                    .map((token) => `\t${token.name}: ${(0, component_2.tokenReferenceFormat)(token, 'scss', handoff)};`)
                    .join('\n'),
            ].join('\n');
        })
            .join('\n\n');
    }
    const design = {
        colors: (0, colors_1.default)(documentationObject.design.color),
        typography: (0, typography_1.default)(documentationObject.design.typography),
        effects: (0, effects_1.default)(documentationObject.design.effect),
    };
    return { components, design };
}
exports.default = scssTransformer;
