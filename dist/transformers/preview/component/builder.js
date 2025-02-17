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
exports.processComponent = void 0;
const chalk_1 = __importDefault(require("chalk"));
const path_1 = __importDefault(require("path"));
const component_1 = require("../component");
const types_1 = require("../types");
const api_1 = require("./api");
const css_1 = __importDefault(require("./css"));
const html_1 = __importDefault(require("./html"));
const javascript_1 = __importDefault(require("./javascript"));
const json_1 = __importDefault(require("./json"));
const versions_1 = __importStar(require("./versions"));
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
    js: null,
    css: null,
    sass: null,
};
/**
 * Process process a specific component
 * @param handoff
 * @param file
 * @param sharedStyles
 */
function processComponent(handoff, id, sharedStyles) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!sharedStyles)
            sharedStyles = yield (0, component_1.processSharedStyles)(handoff);
        const versions = yield (0, versions_1.default)(handoff, id);
        const latest = (0, versions_1.getLatestVersionForComponent)(versions);
        console.log(chalk_1.default.green(`Processing component ${id} `));
        let latestVersion = undefined;
        yield Promise.all(versions.map((version) => __awaiter(this, void 0, void 0, function* () {
            let data = Object.assign(Object.assign({}, defaultComponent), { id });
            const componentPath = path_1.default.join((0, component_1.getComponentPath)(handoff), id, version);
            data = yield (0, json_1.default)(id, componentPath, data);
            data = yield (0, javascript_1.default)(id, componentPath, data, handoff);
            data = yield (0, css_1.default)(id, componentPath, data, handoff, sharedStyles);
            data = yield (0, html_1.default)(id, componentPath, data, handoff);
            data.sharedStyles = sharedStyles;
            yield (0, api_1.writeComponentApi)(id, data, version, handoff);
            if (version === latest) {
                latestVersion = data;
            }
        })));
        if (latestVersion) {
            (0, api_1.writeComponentApi)(id, latestVersion, 'latest', handoff);
            const summary = yield buildComponentSummary(id, latestVersion, versions);
            (0, api_1.writeComponentMetadataApi)(id, summary, handoff);
            return summary;
        }
        throw new Error(`No latest version found for ${id}`);
    });
}
exports.processComponent = processComponent;
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
exports.default = processComponent;
