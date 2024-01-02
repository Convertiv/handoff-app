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
        group: 'Component',
        options: {
            shared: {
                defaults: variantProperties.reduce(function (map, current) {
                    var _a;
                    return __assign(__assign({}, map), (_a = {}, _a[current.name] = (0, utils_2.slugify)(current.default.toString()), _a));
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
var getFigmaFileComponents = function (fileId, accessToken) { return __awaiter(void 0, void 0, void 0, function () {
    var fileComponentSetsRes, err_1, componentSetNodesResult, componentSets, componentsMetadata, componentTokens, _i, componentSets_1, componentSet, definition, components;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                return [4 /*yield*/, (0, api_1.getComponentSets)(fileId, accessToken)];
            case 1:
                fileComponentSetsRes = _b.sent();
                return [3 /*break*/, 3];
            case 2:
                err_1 = _b.sent();
                throw new Error('Handoff could not access the figma file. \n - Check your file id, dev token, and permissions. \n - For more information on permissions, see https://www.handoff.com/docs/guide');
            case 3:
                if (fileComponentSetsRes.data.meta.component_sets.length === 0) {
                    console.error(chalk_1.default.red('Handoff could not find any published components.\n  - If you expected components, please check to make sure you published them.\n  - You must have a paid license to publish components.\n - For more information, see https://www.handoff.com/docs/guide'));
                    console.log(chalk_1.default.blue('Continuing fetch with only colors and typography design foundations'));
                    return [2 /*return*/, {}];
                }
                return [4 /*yield*/, (0, api_1.getComponentSetNodes)(fileId, fileComponentSetsRes.data.meta.component_sets.map(function (item) { return item.node_id; }), accessToken)];
            case 4:
                componentSetNodesResult = _b.sent();
                componentSets = Object.values(componentSetNodesResult.data.nodes)
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
                componentsMetadata = new Map(Object.entries((_a = Object.values(componentSetNodesResult.data.nodes)
                    .map(function (node) {
                    return node === null || node === void 0 ? void 0 : node.components;
                })
                    .reduce(function (acc, cur) {
                    return __assign(__assign({}, acc), cur);
                })) !== null && _a !== void 0 ? _a : {}));
                componentTokens = {};
                for (_i = 0, componentSets_1 = componentSets; _i < componentSets_1.length; _i++) {
                    componentSet = componentSets_1[_i];
                    definition = getComponentSetComponentDefinition(componentSet);
                    if (!componentTokens[definition.name]) {
                        componentTokens[definition.name] = {
                            instances: [],
                            definitions: {},
                        };
                    }
                    components = getComponentNodesWithMetadata(componentSet, componentsMetadata);
                    componentTokens[definition.name].instances = __spreadArray(__spreadArray([], componentTokens[definition.name].instances, true), (0, extractor_1.default)(components, definition), true);
                    componentTokens[definition.name].definitions[componentSet.id] = definition;
                }
                return [2 /*return*/, componentTokens];
        }
    });
}); };
exports.getFigmaFileComponents = getFigmaFileComponents;
