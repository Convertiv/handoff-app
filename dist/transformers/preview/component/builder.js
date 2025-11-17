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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComponentSegment = void 0;
exports.processComponents = processComponents;
const cloneDeep_1 = __importDefault(require("lodash/cloneDeep"));
const schema_1 = require("../../utils/schema");
const types_1 = require("../types");
const api_1 = require("./api");
const css_1 = __importDefault(require("./css"));
const html_1 = __importDefault(require("./html"));
const javascript_1 = __importDefault(require("./javascript"));
const versions_1 = require("./versions");
const defaultComponent = {
    id: '',
    title: 'Untitled',
    figma: '',
    image: '',
    description: 'No description provided',
    preview: 'No preview available',
    type: types_1.ComponentType.Element,
    group: 'default',
    should_do: [],
    should_not_do: [],
    categories: [],
    tags: [],
    previews: {
        generic: {
            title: 'Default',
            values: {},
            url: '',
        },
    },
    properties: {},
    code: '',
    html: '',
    format: 'html',
    js: null,
    css: null,
    sass: null,
};
/**
 * Types of component segments that can be updated
 */
var ComponentSegment;
(function (ComponentSegment) {
    ComponentSegment["JavaScript"] = "javascript";
    ComponentSegment["Style"] = "style";
    ComponentSegment["Previews"] = "previews";
    ComponentSegment["Validation"] = "validation";
})(ComponentSegment || (exports.ComponentSegment = ComponentSegment = {}));
/**
 * Determines which keys should be preserved based on the segment being processed.
 * When processing a specific segment, we want to preserve data from other segments
 * to avoid overwriting them with undefined values.
 */
function getPreserveKeysForSegment(segmentToProcess) {
    if (!segmentToProcess) {
        return []; // No preservation needed for full updates
    }
    switch (segmentToProcess) {
        case ComponentSegment.JavaScript:
            // When processing JavaScript segment, preserve CSS and previews data
            return ['css', 'sass', 'sharedStyles', 'previews', 'validations'];
        case ComponentSegment.Style:
            // When processing Style segment, preserve JavaScript and previews data
            return ['js', 'jsCompiled', 'previews', 'validations'];
        case ComponentSegment.Previews:
            // When processing Previews segment, preserve JavaScript and CSS data
            return ['js', 'jsCompiled', 'css', 'sass', 'sharedStyles', 'validations'];
        case ComponentSegment.Validation:
            // When processing Validation segment, preserve all other data
            return ['js', 'jsCompiled', 'css', 'sass', 'sharedStyles', 'previews'];
        default:
            return [];
    }
}
/**
 * Process components and generate their code, styles, and previews
 * @param handoff - The Handoff instance containing configuration and state
 * @param id - Optional component ID to process a specific component
 * @param segmentToProcess - Optional segment to update
 * @returns Promise resolving to an array of processed components
 */
function processComponents(handoff, id, segmentToProcess) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        const result = [];
        const documentationObject = yield handoff.getDocumentationObject();
        const components = (_a = documentationObject === null || documentationObject === void 0 ? void 0 : documentationObject.components) !== null && _a !== void 0 ? _a : {};
        const sharedStyles = yield handoff.getSharedStyles();
        const runtimeComponents = (_d = (_c = (_b = handoff.integrationObject) === null || _b === void 0 ? void 0 : _b.entries) === null || _c === void 0 ? void 0 : _c.components) !== null && _d !== void 0 ? _d : {};
        // Determine which keys to preserve based on the segment being processed
        // This ensures that when processing only specific segments (e.g., JavaScript only),
        // we don't overwrite data from other segments (e.g., CSS, previews) with undefined values
        const preserveKeys = getPreserveKeysForSegment(segmentToProcess);
        for (const runtimeComponentId of Object.keys(runtimeComponents)) {
            if (!!id && runtimeComponentId !== id) {
                continue;
            }
            const versions = Object.keys(runtimeComponents[runtimeComponentId]);
            const latest = (0, versions_1.getLatestVersionForComponent)(versions);
            let latestVersion;
            yield Promise.all(versions.map((version) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                const runtimeComponent = runtimeComponents[runtimeComponentId][version];
                const { type } = runtimeComponent, restMetadata = __rest(runtimeComponent, ["type"]);
                let data = Object.assign(Object.assign(Object.assign({}, (0, cloneDeep_1.default)(defaultComponent)), restMetadata), { type: type || types_1.ComponentType.Element });
                if (!segmentToProcess || segmentToProcess === ComponentSegment.JavaScript || segmentToProcess === ComponentSegment.Validation) {
                    data = yield (0, javascript_1.default)(data, handoff);
                }
                if (!segmentToProcess || segmentToProcess === ComponentSegment.Style || segmentToProcess === ComponentSegment.Validation) {
                    data = yield (0, css_1.default)(data, handoff, sharedStyles);
                }
                if (!segmentToProcess || segmentToProcess === ComponentSegment.Previews || segmentToProcess === ComponentSegment.Validation) {
                    data = yield (0, html_1.default)(data, handoff, components);
                }
                if (segmentToProcess === ComponentSegment.Validation && ((_b = (_a = handoff.config) === null || _a === void 0 ? void 0 : _a.hooks) === null || _b === void 0 ? void 0 : _b.validateComponent)) {
                    const validationResults = yield handoff.config.hooks.validateComponent(data);
                    data.validations = validationResults;
                }
                data.sharedStyles = sharedStyles;
                // recurse through all properties and ensure that every property has an id
                data.properties = (0, schema_1.ensureIds)(data.properties);
                yield (0, api_1.writeComponentApi)(runtimeComponentId, data, version, handoff, preserveKeys);
                if (version === latest) {
                    latestVersion = data;
                }
            })));
            if (latestVersion) {
                yield (0, api_1.writeComponentApi)(runtimeComponentId, latestVersion, 'latest', handoff, preserveKeys);
                const summary = buildComponentSummary(runtimeComponentId, latestVersion, versions);
                yield (0, api_1.writeComponentMetadataApi)(runtimeComponentId, summary, handoff);
                result.push(summary);
            }
            else {
                throw new Error(`No latest version found for ${runtimeComponentId}`);
            }
        }
        // Always merge and write summary file, even if no components processed
        const isFullRebuild = !id;
        yield (0, api_1.updateComponentSummaryApi)(handoff, result, isFullRebuild);
        return result;
    });
}
/**
 * Build a summary for the component list
 * @param id
 * @param latest
 * @param versions
 * @returns
 */
const buildComponentSummary = (id, latest, versions) => {
    return {
        id,
        version: versions[0],
        title: latest.title,
        description: latest.description,
        type: latest.type,
        group: latest.group,
        image: latest.image ? latest.image : '',
        figma: latest.figma ? latest.figma : '',
        categories: latest.categories ? latest.categories : [],
        tags: latest.tags ? latest.tags : [],
        properties: latest.properties,
        previews: latest.previews,
        versions,
        paths: versions.map((version) => `/api/component/${id}/${version}.json`),
    };
};
exports.default = processComponents;
