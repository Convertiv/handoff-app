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
const handlebars_1 = __importDefault(require("handlebars"));
const node_html_parser_1 = require("node-html-parser");
const index_1 = require("../../utils/index");
const utils_1 = require("./utils");
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
function mergeTokenSets(tokenSetList) {
    const obj = {};
    tokenSetList.forEach((item) => {
        Object.entries(item).forEach(([key, value]) => {
            if (key !== 'name') {
                obj[key] = value;
            }
        });
    });
    return obj;
}
const getComponentTemplateByComponentId = (handoff, componentId, component) => __awaiter(void 0, void 0, void 0, function* () {
    const parts = [];
    component.variantProperties.forEach(([_, value]) => parts.push(value));
    return yield (0, utils_1.getComponentTemplate)(handoff, componentId, parts);
});
/**
 * Transforms the component tokens into a preview and code
 */
const transformComponentTokens = (handoff, componentId, component) => __awaiter(void 0, void 0, void 0, function* () {
    if (!handoff) {
        throw Error('Handoff not initialized');
    }
    const template = yield getComponentTemplateByComponentId(handoff, componentId, component);
    if (!template) {
        return null;
    }
    const renderableComponent = { variant: {}, parts: {} };
    component.variantProperties.forEach(([variantProp, value]) => {
        renderableComponent.variant[variantProp] = value;
    });
    if (component.parts) {
        Object.keys(component.parts).forEach((part) => {
            renderableComponent.parts[part] = mergeTokenSets(component.parts[part]);
        });
    }
    let preview = handlebars_1.default.compile(template)(renderableComponent);
    if (handoff.config.app.base_path) {
        preview = preview.replace(/(?:href|src|ref)=["']([^"']+)["']/g, (match, capturedGroup) => {
            return match.replace(capturedGroup, handoff.config.app.base_path + capturedGroup);
        });
    }
    const bodyEl = (0, node_html_parser_1.parse)(preview).querySelector('body');
    return {
        id: component.id,
        preview,
        code: bodyEl ? bodyEl.innerHTML.trim() : preview,
    };
});
/**
 * Transforms the documentation object components into a preview and code
 */
function previewTransformer(handoff, documentationObject) {
    return __awaiter(this, void 0, void 0, function* () {
        const { components } = documentationObject;
        const componentIds = Object.keys(components);
        const result = yield Promise.all(componentIds.map((componentId) => __awaiter(this, void 0, void 0, function* () {
            return [
                componentId,
                yield Promise.all(documentationObject.components[componentId].instances.map((instance) => {
                    return transformComponentTokens(handoff, componentId, instance);
                })).then((res) => res.filter(index_1.filterOutNull)),
            ];
        })));
        yield publishTokensAPI(handoff, documentationObject);
        let previews = result.reduce((obj, el) => {
            obj[el[0]] = el[1];
            return obj;
        }, {});
        return {
            components: previews,
        };
    });
}
exports.default = previewTransformer;
/**
 *
 * @param tokens
 */
const publishTokensAPI = (handoff, tokens) => __awaiter(void 0, void 0, void 0, function* () {
    // get public api path
    const apiPath = path_1.default.resolve(path_1.default.join(handoff.workingPath, 'public/api'));
    // create the api path if it doesn't exist
    if (!fs_extra_1.default.existsSync(apiPath)) {
        fs_extra_1.default.mkdirSync(apiPath, { recursive: true });
    }
    // write tokens to the api path
    fs_extra_1.default.writeFileSync(path_1.default.join(apiPath, 'tokens.json'), JSON.stringify(tokens, null, 2));
    if (!fs_extra_1.default.existsSync(path_1.default.join(apiPath, 'tokens'))) {
        fs_extra_1.default.mkdirSync(path_1.default.join(apiPath, 'tokens'));
    }
    for (const type in tokens) {
        if (type === 'timestamp')
            continue;
        for (const group in tokens[type]) {
            fs_extra_1.default.writeFileSync(path_1.default.join(apiPath, 'tokens', `${group}.json`), JSON.stringify(tokens[type][group], null, 2));
        }
    }
});
