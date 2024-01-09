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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFigmaFileComponents = void 0;
var chalk_1 = __importDefault(require("chalk"));
var api_1 = require("../../figma/api");
var utils_1 = require("../utils");
var extractor_1 = __importDefault(require("./extractor"));
var utils_2 = require("../../utils");
var groupReplaceRules = function (tupleList) {
    var res = {};
    tupleList.forEach(function (tuple) {
        var variantProp = tuple[0];
        var find = (0, utils_2.slugify)(tuple[1]);
        var replace = tuple[2];
        if (!res[variantProp]) {
            res[variantProp] = {};
        }
        res[variantProp][find] = replace;
    });
    return res;
};
var getComponentSetComponentDefinition = function (componentSet) {
    var metadata = JSON.parse(componentSet.sharedPluginData["convertiv_handoff_app"]["node_".concat(componentSet.id, "_settings")]);
    var id = componentSet.id;
    var name = (0, utils_2.slugify)(metadata.name);
    if (!componentSet.componentPropertyDefinitions) {
        return null;
    }
    var variantProperties = Object.entries(componentSet.componentPropertyDefinitions)
        .map(function (_a) {
        var _b;
        var variantPropertyName = _a[0], variantPropertyDefinition = _a[1];
        return {
            name: variantPropertyName,
            type: variantPropertyDefinition.type,
            default: variantPropertyDefinition.defaultValue,
            options: (_b = variantPropertyDefinition.variantOptions) !== null && _b !== void 0 ? _b : [],
        };
    })
        .filter(function (variantProperty) { return variantProperty.type === 'VARIANT'; });
    return {
        id: id,
        name: name,
        group: '',
        options: {
            shared: {
                defaults: Object.entries(metadata.defaults).reduce(function (res, _a) {
                    var _b;
                    var variantProperty = _a[0], defaultValue = _a[1];
                    return __assign(__assign({}, res), (_b = {}, _b[variantProperty] = (0, utils_2.slugify)(defaultValue), _b));
                }, {}),
            },
            exporter: {
                variantProperties: variantProperties.map(function (variantProp) { return variantProp.name; }),
                sharedComponentVariants: metadata.sharedVariants,
            },
            transformer: {
                cssRootClass: name === 'button' ? 'btn' : name,
                tokenNameSegments: metadata.tokenNameSegments,
                replace: groupReplaceRules(metadata.replacements),
            },
        },
        parts: metadata.parts.map(function (part) { return ({
            id: (0, utils_2.slugify)(part.name),
            tokens: part.definitions,
        }); }),
    };
};
var getComponentNodesWithMetadata = function (componentSet, componentsMetadata) {
    return componentSet.children.map(function (component) { return ({
        node: component,
        metadata: componentsMetadata.get(component.id),
    }); });
};
var getFigmaFileComponents = function (fileId, accessToken, legacyDefinitions) { return __awaiter(void 0, void 0, void 0, function () {
    var useLegacyFetchFlow, fileComponentSetsRes, err_1, fullComponentMetadataArray, componentSetNodesResult;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                useLegacyFetchFlow = !!legacyDefinitions;
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, (0, api_1.getComponentSets)(fileId, accessToken)];
            case 2:
                fileComponentSetsRes = _a.sent();
                return [3 /*break*/, 4];
            case 3:
                err_1 = _a.sent();
                throw new Error('Handoff could not access the figma file. \n - Check your file id, dev token, and permissions. \n - For more information on permissions, see https://www.handoff.com/docs/guide');
            case 4:
                fullComponentMetadataArray = fileComponentSetsRes.data.meta.component_sets;
                if (fullComponentMetadataArray.length === 0) {
                    console.error(chalk_1.default.red('Handoff could not find any published components.\n  - If you expected components, please check to make sure you published them.\n  - You must have a paid license to publish components.\n - For more information, see https://www.handoff.com/docs/guide'));
                    console.log(chalk_1.default.blue('Continuing fetch with only colors and typography design foundations'));
                    return [2 /*return*/, {}];
                }
                return [4 /*yield*/, (0, api_1.getComponentSetNodes)(fileId, fullComponentMetadataArray.map(function (item) { return item.node_id; }), accessToken)];
            case 5:
                componentSetNodesResult = _a.sent();
                if (useLegacyFetchFlow) {
                    return [2 /*return*/, processFigmaNodesForLegacyDefinitions(componentSetNodesResult.data, fullComponentMetadataArray, legacyDefinitions)];
                }
                return [2 /*return*/, processFigmaNodes(componentSetNodesResult.data)];
        }
    });
}); };
exports.getFigmaFileComponents = getFigmaFileComponents;
var processFigmaNodes = function (fileNodesResponse) {
    var _a;
    console.warn(chalk_1.default.redBright('!!! Using Handoff Figma Plugin fetch flow !!!'));
    var componentTokens = {};
    var componentsMetadata = new Map(Object.entries((_a = Object.values(fileNodesResponse.nodes)
        .map(function (node) {
        return node === null || node === void 0 ? void 0 : node.components;
    })
        .reduce(function (acc, cur) {
        return __assign(__assign({}, acc), cur);
    })) !== null && _a !== void 0 ? _a : {}));
    var componentSets = Object.values(fileNodesResponse.nodes)
        .map(function (node) { return node === null || node === void 0 ? void 0 : node.document; })
        .filter((0, utils_1.filterByNodeType)('COMPONENT_SET'))
        .filter(function (componentSet) {
        try {
            if (!componentSet.sharedPluginData || !componentSet.sharedPluginData["convertiv_handoff_app"]) {
                return false;
            }
            var settings = JSON.parse(componentSet.sharedPluginData["convertiv_handoff_app"]["node_".concat(componentSet.id, "_settings")]);
            return settings.exposed;
        }
        catch (_a) {
            return false;
        }
    });
    for (var _i = 0, componentSets_1 = componentSets; _i < componentSets_1.length; _i++) {
        var componentSet = componentSets_1[_i];
        var definition = getComponentSetComponentDefinition(componentSet);
        if (!definition) {
            continue;
        }
        if (!componentTokens[definition.name]) {
            componentTokens[definition.name] = {
                instances: [],
                definitions: {},
            };
        }
        var components = getComponentNodesWithMetadata(componentSet, componentsMetadata);
        componentTokens[definition.name].instances = __spreadArray(__spreadArray([], componentTokens[definition.name].instances, true), (0, extractor_1.default)(components, definition), true);
        componentTokens[definition.name].definitions[componentSet.id] = definition;
    }
    return componentTokens;
};
/**
 * Processes figma nodes by utilizing the legacy component definitions
 * @deprecated Will be removed before 1.0.0 release.
 */
var processFigmaNodesForLegacyDefinitions = function (fileNodesResponse, fullComponentMetadataArray, legacyDefinitions) {
    var _a;
    var componentTokens = {};
    var componentsMetadata = new Map(Object.entries((_a = Object.values(fileNodesResponse.nodes)
        .map(function (node) {
        return node === null || node === void 0 ? void 0 : node.components;
    })
        .reduce(function (acc, cur) {
        return __assign(__assign({}, acc), cur);
    })) !== null && _a !== void 0 ? _a : {}));
    var figmaComponentSetNodes = Object.values(fileNodesResponse.nodes)
        .map(function (node) { return node === null || node === void 0 ? void 0 : node.document; })
        .filter((0, utils_1.filterByNodeType)('COMPONENT_SET'));
    for (var _i = 0, legacyDefinitions_1 = legacyDefinitions; _i < legacyDefinitions_1.length; _i++) {
        var legacyDefinition = legacyDefinitions_1[_i];
        if (!legacyDefinition.id) {
            console.error(chalk_1.default.red('Handoff could not process exportable component without a id.\n  - Please update the exportable definition to include the name of the component.\n - For more information, see https://www.handoff.com/docs/guide'));
            continue;
        }
        if (!legacyDefinition.options.exporter.search) {
            console.error(chalk_1.default.red('Handoff could not process exportable component without search.\n  - Please update the exportable definition to include the search property.\n - For more information, see https://www.handoff.com/docs/guide'));
            continue;
        }
        var componentSets = getComponentSetsForLegacyComponentDefinition(figmaComponentSetNodes, fullComponentMetadataArray, legacyDefinition);
        for (var _b = 0, componentSets_2 = componentSets; _b < componentSets_2.length; _b++) {
            var componentSet = componentSets_2[_b];
            var definition = getComponentDefinitionForLegacyComponentDefinition(componentSet, legacyDefinition);
            if (!componentTokens[definition.name]) {
                componentTokens[definition.name] = {
                    instances: [],
                    definitions: {},
                };
            }
            var components = getComponentNodesWithMetadata(componentSet, componentsMetadata);
            componentTokens[definition.name].instances = __spreadArray(__spreadArray([], componentTokens[definition.name].instances, true), (0, extractor_1.default)(components, definition, legacyDefinition), true);
            componentTokens[definition.name].definitions[componentSet.id] = definition;
        }
    }
    return componentTokens;
};
/**
 * Returns the legacy component definition variant property with all associated parameters.
 * @deprecated Will be removed before 1.0.0 release.
 */
var getComponentPropertyWithParams = function (variantProperty) {
    var _a;
    var regex = /^([^:]+)(?:\(([^)]+)\))?$/;
    var matches = variantProperty.match(regex);
    if (!matches || matches.length !== 3) {
        return null; // ignore if format is invalid
    }
    var key = matches[1].trim();
    var value = (_a = matches[2]) === null || _a === void 0 ? void 0 : _a.trim();
    return {
        variantProperty: key,
        params: value ? value.substring(1).split(':').map(function (param) { return param.split(/\/(.*)/s).slice(0, 2); }) : undefined,
    };
};
/**
 * Returns the new component definition for the provided component set and respective legacy definition.
 * @deprecated Will be removed before 1.0.0 release.
 */
var getComponentDefinitionForLegacyComponentDefinition = function (componentSet, legacyDefinition) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    var supportedVariantProps = __spreadArray(__spreadArray([], (_d = (_c = (_b = (_a = legacyDefinition === null || legacyDefinition === void 0 ? void 0 : legacyDefinition.options) === null || _a === void 0 ? void 0 : _a.exporter) === null || _b === void 0 ? void 0 : _b.supportedVariantProps) === null || _c === void 0 ? void 0 : _c.design) !== null && _d !== void 0 ? _d : [], true), (_h = (_g = (_f = (_e = legacyDefinition === null || legacyDefinition === void 0 ? void 0 : legacyDefinition.options) === null || _e === void 0 ? void 0 : _e.exporter) === null || _f === void 0 ? void 0 : _f.supportedVariantProps) === null || _g === void 0 ? void 0 : _g.layout) !== null && _h !== void 0 ? _h : [], true);
    var definitionSupportedVariantProperties = supportedVariantProps.map(function (variantProp) { return variantProp.replace(/ *\([^)]*\) */g, ''); });
    var definitionSupportedVariantPropertiesWithShareParams = supportedVariantProps.filter(function (variantProperty) { return variantProperty.match((/ *\([^)]*\) */g)); });
    var variantProperties = Object.entries(componentSet.componentPropertyDefinitions)
        .map(function (_a) {
        var _b;
        var variantPropertyName = _a[0], variantPropertyDefinition = _a[1];
        return {
            name: variantPropertyName,
            type: variantPropertyDefinition.type,
            default: variantPropertyDefinition.defaultValue,
            options: (_b = variantPropertyDefinition.variantOptions) !== null && _b !== void 0 ? _b : [],
        };
    })
        .filter(function (variantProperty) { return variantProperty.type === 'VARIANT' && definitionSupportedVariantProperties.includes(variantProperty.name); });
    var sharedComponentVariants = [];
    if (definitionSupportedVariantPropertiesWithShareParams.length > 0) {
        definitionSupportedVariantPropertiesWithShareParams.forEach(function (item) {
            var shareDefinition = getComponentPropertyWithParams(item);
            shareDefinition.params.forEach(function (_a) {
                var searchValue = _a[0], distinctiveVariantPropertiesStr = _a[1];
                componentSet.children
                    .filter(function (component) {
                    var _a;
                    return (0, utils_2.slugify)((_a = (0, utils_1.getComponentInstanceNamePart)(component.name, shareDefinition.variantProperty)) !== null && _a !== void 0 ? _a : '') === (0, utils_2.slugify)(searchValue);
                })
                    .forEach(function (component) {
                    return sharedComponentVariants.push({
                        componentId: component.id,
                        distinctiveVariantProperties: distinctiveVariantPropertiesStr.split(','),
                        sharedVariantProperty: shareDefinition.variantProperty,
                    });
                });
            });
        });
    }
    return {
        id: componentSet.id,
        name: legacyDefinition.id,
        group: legacyDefinition.group,
        options: {
            shared: {
                defaults: legacyDefinition.options.shared.defaults,
            },
            exporter: {
                variantProperties: variantProperties.map(function (variantProp) { return variantProp.name; }),
                sharedComponentVariants: sharedComponentVariants,
            },
            transformer: {
                cssRootClass: legacyDefinition.options.transformer.cssRootClass,
                tokenNameSegments: legacyDefinition.options.transformer.tokenNameSegments,
                replace: legacyDefinition.options.transformer.replace,
            },
        },
        parts: legacyDefinition.parts,
    };
};
/**
 * Returns the array of component sets that match the search critera of the provided legacy component definition.
 * @deprecated Will be removed before 1.0.0 release.
 */
var getComponentSetsForLegacyComponentDefinition = function (componentSets, componentSetsMetadata, legacyDefinition) {
    // Retrieve the component set with the given name (search)
    var primaryComponentSet = componentSets.find(function (componentSet) { return componentSet.name === legacyDefinition.options.exporter.search; });
    // Check if the component set exists
    if (!primaryComponentSet) {
        throw new Error("No component set found for ".concat(name));
    }
    // Locate component set metadata
    var primaryComponentSetMetadata = componentSetsMetadata.find(function (metadata) { return metadata.node_id === primaryComponentSet.id; });
    // Find other component sets located within the same containing frame of the found component set
    var releavantComponentSets = primaryComponentSetMetadata
        ? componentSetsMetadata
            .filter(function (metadata) {
            return metadata.node_id !== primaryComponentSetMetadata.node_id &&
                metadata.containing_frame.nodeId === primaryComponentSetMetadata.containing_frame.nodeId;
        })
            .map(function (meta) { return componentSets.find(function (componentSet) { return componentSet.id === meta.node_id; }); })
        : [];
    // Return the result
    return __spreadArray([primaryComponentSet], releavantComponentSets, true);
};
