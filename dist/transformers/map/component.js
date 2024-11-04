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
exports.transformComponentsToVariantsMap = exports.transformComponentsToMap = void 0;
var transformer_1 = require("../transformer");
var utils_1 = require("../utils");
var Utils = __importStar(require("../../utils/index"));
/**
 * Transforms the component tokens into a style dictionary
 * @param alerts
 * @returns
 */
var transformComponentsToMap = function (_, component, integrationOptions) {
    var map = {};
    component.instances.forEach(function (instance) {
        var tokens = (0, transformer_1.transform)('map', instance, integrationOptions);
        tokens.forEach(function (token) {
            map[token.name] = token.value;
        });
    });
    return map;
};
exports.transformComponentsToMap = transformComponentsToMap;
var transformComponentsToVariantsMap = function (component, options) {
    var result = {};
    component.instances.forEach(function (instance) {
        instance.variantProperties.forEach(function (_a) {
            var _b;
            var _c;
            var variantProp = _a[0], value = _a[1];
            if (value) {
                (_b = result[_c = Utils.slugify(variantProp)]) !== null && _b !== void 0 ? _b : (result[_c] = new Set());
                result[Utils.slugify(variantProp)].add(Utils.slugify((0, utils_1.normalizeTokenNamePartValue)(variantProp, value, options, true)));
            }
        });
    });
    return Object.keys(result).reduce(function (acc, key) {
        // Convert each Set<string> to an array
        acc[key] = Array.from(result[key]);
        return acc;
    }, {});
};
exports.transformComponentsToVariantsMap = transformComponentsToVariantsMap;
