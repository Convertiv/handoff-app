"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFigmaFileComponents = void 0;
const chalk_1 = __importDefault(require("chalk"));
const api_1 = require("../../figma/api");
const utils_1 = require("../utils");
const extractor_1 = __importDefault(require("./extractor"));
const utils_2 = require("../../utils");
const groupReplaceRules = (tupleList) => {
    const res = {};
    tupleList.forEach(tuple => {
        const variantProp = tuple[0];
        const find = (0, utils_2.slugify)(tuple[1]);
        const replace = tuple[2];
        if (!res[variantProp]) {
            res[variantProp] = {};
        }
        res[variantProp][find] = replace;
    });
    return res;
};
const getComponentSetComponentDefinition = (componentSet) => {
    const metadata = JSON.parse(componentSet.sharedPluginData[`convertiv_handoff_app`][`node_${componentSet.id}_settings`]);
    const id = componentSet.id;
    const name = (0, utils_2.slugify)(metadata.name);
    if (!componentSet.componentPropertyDefinitions) {
        return null;
    }
    const variantProperties = Object.entries(componentSet.componentPropertyDefinitions)
        .map(([variantPropertyName, variantPropertyDefinition]) => {
        var _a;
        return {
            name: variantPropertyName,
            type: variantPropertyDefinition.type,
            default: variantPropertyDefinition.defaultValue,
            options: (_a = variantPropertyDefinition.variantOptions) !== null && _a !== void 0 ? _a : [],
        };
    })
        .filter((variantProperty) => variantProperty.type === 'VARIANT');
    return {
        id,
        name,
        group: '',
        options: {
            exporter: {
                variantProperties: variantProperties.map((variantProp) => variantProp.name),
                sharedComponentVariants: metadata.sharedVariants,
            },
        },
        parts: metadata.parts.map((part) => ({
            id: (0, utils_2.slugify)(part.name),
            tokens: part.definitions,
        })),
    };
};
/**
 * Given a component set, returns an array of objects containing the component
 * node and its metadata.
 * @param componentSet
 * @param componentsMetadata
 * @returns {Array<{node: FigmaTypes.Component, metadata: FigmaTypes.ComponentMetadata}>}
 */
const getComponentNodesWithMetadata = (componentSet, componentsMetadata) => {
    return componentSet.children.map((component) => ({
        node: component,
        metadata: componentsMetadata.get(component.id),
    }));
};
/**
 * Given a component set, returns an array of objects containing the component
 * @param handoff
 * @param legacyDefinitions
 * @returns
 */
const getFigmaFileComponents = (handoff, legacyDefinitions) => __awaiter(void 0, void 0, void 0, function* () {
    const useLegacyFetchFlow = !!legacyDefinitions;
    let fileComponentSetsRes;
    try {
        fileComponentSetsRes = yield (0, api_1.getComponentSets)(handoff.config.figma_project_id, handoff.config.dev_access_token);
    }
    catch (err) {
        throw new Error('Handoff could not access the figma file. \n - Check your file id, dev token, and permissions. \n - For more information on permissions, see https://www.handoff.com/docs/guide');
    }
    const fullComponentMetadataArray = fileComponentSetsRes.data.meta.component_sets;
    if (fullComponentMetadataArray.length === 0) {
        console.error(chalk_1.default.red('Handoff could not find any published components.\n  - If you expected components, please check to make sure you published them.\n  - You must have a paid license to publish components.\n - For more information, see https://www.handoff.com/docs/guide'));
        console.log(chalk_1.default.blue('Continuing fetch with only colors and typography design foundations'));
        return {};
    }
    const componentSetNodesResult = yield (0, api_1.getComponentSetNodes)(handoff.config.figma_project_id, fullComponentMetadataArray.map((item) => item.node_id), handoff.config.dev_access_token);
    if (useLegacyFetchFlow) {
        return processFigmaNodesForLegacyDefinitions(componentSetNodesResult.data, fullComponentMetadataArray, legacyDefinitions, handoff);
    }
    return processFigmaNodes(componentSetNodesResult.data, handoff);
});
exports.getFigmaFileComponents = getFigmaFileComponents;
/**
 * Processes figma nodes by utilizing the new component definitions
 * @param fileNodesResponse FigmaTypes.FileNodesResponse
 * @param handoff Handoff instance
 * @returns FileComponentsObject
 */
const processFigmaNodes = (fileNodesResponse, handoff) => {
    var _a;
    const componentTokens = {};
    const componentsMetadata = new Map(Object.entries((_a = Object.values(fileNodesResponse.nodes)
        .map((node) => {
        return node === null || node === void 0 ? void 0 : node.components;
    })
        .reduce((acc, cur) => {
        return Object.assign(Object.assign({}, acc), cur);
    })) !== null && _a !== void 0 ? _a : {}));
    const componentSets = Object.values(fileNodesResponse.nodes)
        .map((node) => node === null || node === void 0 ? void 0 : node.document)
        .filter((0, utils_1.filterByNodeType)('COMPONENT_SET'))
        .filter((componentSet) => {
        try {
            if (!componentSet.sharedPluginData || !componentSet.sharedPluginData[`convertiv_handoff_app`]) {
                return false;
            }
            const settings = JSON.parse(componentSet.sharedPluginData[`convertiv_handoff_app`][`node_${componentSet.id}_settings`]);
            return !!settings.exposed;
        }
        catch (_a) {
            return false;
        }
    });
    for (const componentSet of componentSets) {
        const definition = getComponentSetComponentDefinition(componentSet);
        if (!definition) {
            continue;
        }
        if (!componentTokens[definition.name]) {
            componentTokens[definition.name] = {
                instances: [],
            };
        }
        const components = getComponentNodesWithMetadata(componentSet, componentsMetadata);
        componentTokens[definition.name].instances = [
            ...componentTokens[definition.name].instances,
            ...(0, extractor_1.default)(components, definition, handoff),
        ];
    }
    return componentTokens;
};
/**
 * Processes figma nodes by utilizing the legacy component definitions
 * @deprecated Will be removed before 1.0.0 release.
 */
const processFigmaNodesForLegacyDefinitions = (fileNodesResponse, fullComponentMetadataArray, legacyDefinitions, handoff) => {
    var _a;
    console.warn(chalk_1.default.redBright('!!! Using legacy fetch flow !!!'));
    const componentTokens = {};
    const componentsMetadata = new Map(Object.entries((_a = Object.values(fileNodesResponse.nodes)
        .map((node) => {
        return node === null || node === void 0 ? void 0 : node.components;
    })
        .reduce((acc, cur) => {
        return Object.assign(Object.assign({}, acc), cur);
    })) !== null && _a !== void 0 ? _a : {}));
    const figmaComponentSetNodes = Object.values(fileNodesResponse.nodes)
        .map((node) => node === null || node === void 0 ? void 0 : node.document)
        .filter((0, utils_1.filterByNodeType)('COMPONENT_SET'));
    for (const legacyDefinition of legacyDefinitions) {
        if (!legacyDefinition.id) {
            console.error(chalk_1.default.red('Handoff could not process exportable component without a id.\n  - Please update the exportable definition to include the name of the component.\n - For more information, see https://www.handoff.com/docs/guide'));
            continue;
        }
        if (!legacyDefinition.options.exporter.search) {
            console.error(chalk_1.default.red('Handoff could not process exportable component without search.\n  - Please update the exportable definition to include the search property.\n - For more information, see https://www.handoff.com/docs/guide'));
            continue;
        }
        const componentSets = getComponentSetsForLegacyComponentDefinition(figmaComponentSetNodes, fullComponentMetadataArray, legacyDefinition);
        for (const componentSet of componentSets) {
            const definition = getComponentDefinitionForLegacyComponentDefinition(componentSet, legacyDefinition);
            if (!componentTokens[definition.name]) {
                componentTokens[definition.name] = {
                    instances: [],
                };
            }
            const components = getComponentNodesWithMetadata(componentSet, componentsMetadata);
            componentTokens[definition.name].instances = [
                ...componentTokens[definition.name].instances,
                ...(0, extractor_1.default)(components, definition, handoff, legacyDefinition),
            ];
        }
    }
    return componentTokens;
};
/**
 * Returns the legacy component definition variant property with all associated parameters.
 * @deprecated Will be removed before 1.0.0 release.
 */
const getComponentPropertyWithParams = (variantProperty) => {
    var _a;
    const regex = /^([^:]+)(?:\(([^)]+)\))?$/;
    const matches = variantProperty.match(regex);
    if (!matches || matches.length !== 3) {
        return null; // ignore if format is invalid
    }
    const key = matches[1].trim();
    const value = (_a = matches[2]) === null || _a === void 0 ? void 0 : _a.trim();
    return {
        variantProperty: key,
        params: value ? value.substring(1).split(':').map(param => param.split(/\/(.*)/s).slice(0, 2)) : undefined,
    };
};
/**
 * Returns the new component definition for the provided component set and respective legacy definition.
 * @deprecated Will be removed before 1.0.0 release.
 */
const getComponentDefinitionForLegacyComponentDefinition = (componentSet, legacyDefinition) => {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const supportedVariantProps = [
        ...(_d = (_c = (_b = (_a = legacyDefinition === null || legacyDefinition === void 0 ? void 0 : legacyDefinition.options) === null || _a === void 0 ? void 0 : _a.exporter) === null || _b === void 0 ? void 0 : _b.supportedVariantProps) === null || _c === void 0 ? void 0 : _c.design) !== null && _d !== void 0 ? _d : [],
        ...(_h = (_g = (_f = (_e = legacyDefinition === null || legacyDefinition === void 0 ? void 0 : legacyDefinition.options) === null || _e === void 0 ? void 0 : _e.exporter) === null || _f === void 0 ? void 0 : _f.supportedVariantProps) === null || _g === void 0 ? void 0 : _g.layout) !== null && _h !== void 0 ? _h : [],
    ];
    const definitionSupportedVariantProperties = supportedVariantProps.map((variantProp) => variantProp.replace(/ *\([^)]*\) */g, ''));
    const definitionSupportedVariantPropertiesWithShareParams = supportedVariantProps.filter(variantProperty => variantProperty.match((/ *\([^)]*\) */g)));
    const variantProperties = Object.entries(componentSet.componentPropertyDefinitions)
        .map(([variantPropertyName, variantPropertyDefinition]) => {
        var _a;
        return {
            name: variantPropertyName,
            type: variantPropertyDefinition.type,
            default: variantPropertyDefinition.defaultValue,
            options: (_a = variantPropertyDefinition.variantOptions) !== null && _a !== void 0 ? _a : [],
        };
    })
        .filter((variantProperty) => variantProperty.type === 'VARIANT' && definitionSupportedVariantProperties.includes(variantProperty.name));
    const sharedComponentVariants = [];
    if (definitionSupportedVariantPropertiesWithShareParams.length > 0) {
        definitionSupportedVariantPropertiesWithShareParams.forEach((item) => {
            const shareDefinition = getComponentPropertyWithParams(item);
            shareDefinition.params.forEach(([searchValue, distinctiveVariantPropertiesStr]) => {
                componentSet.children
                    .filter((component) => {
                    var _a;
                    return (0, utils_2.slugify)((_a = (0, utils_1.getComponentInstanceNamePart)(component.name, shareDefinition.variantProperty)) !== null && _a !== void 0 ? _a : '') === (0, utils_2.slugify)(searchValue);
                })
                    .forEach((component) => sharedComponentVariants.push({
                    componentId: component.id,
                    distinctiveVariantProperties: distinctiveVariantPropertiesStr.split(','),
                    sharedVariantProperty: shareDefinition.variantProperty,
                }));
            });
        });
    }
    return {
        id: componentSet.id,
        name: legacyDefinition.id,
        group: legacyDefinition.group,
        options: {
            exporter: {
                variantProperties: variantProperties.map((variantProp) => variantProp.name),
                sharedComponentVariants,
            },
        },
        parts: legacyDefinition.parts,
    };
};
/**
 * Returns the array of component sets that match the search critera of the provided legacy component definition.
 * @deprecated Will be removed before 1.0.0 release.
 */
const getComponentSetsForLegacyComponentDefinition = (componentSets, componentSetsMetadata, legacyDefinition) => {
    // Retrieve the component set with the given name (search)
    const primaryComponentSet = componentSets.find((componentSet) => componentSet.name === legacyDefinition.options.exporter.search);
    // Check if the component set exists
    if (!primaryComponentSet) {
        throw new Error(`No component set found for ${legacyDefinition.options.exporter.search}`);
    }
    // Locate component set metadata
    const primaryComponentSetMetadata = componentSetsMetadata.find((metadata) => metadata.node_id === primaryComponentSet.id);
    // Find other component sets located within the same containing frame of the found component set
    const releavantComponentSets = primaryComponentSetMetadata
        ? componentSetsMetadata
            .filter((metadata) => metadata.node_id !== primaryComponentSetMetadata.node_id &&
            metadata.containing_frame.nodeId === primaryComponentSetMetadata.containing_frame.nodeId)
            .map((meta) => componentSets.find((componentSet) => componentSet.id === meta.node_id))
        : [];
    // Return the result
    return [primaryComponentSet, ...releavantComponentSets];
};
