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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var mustache_1 = __importDefault(require("mustache"));
var node_html_parser_1 = require("node-html-parser");
var index_1 = require("../../utils/index");
var utils_1 = require("./utils");
function mergeTokenSets(tokenSetList) {
    var obj = {};
    tokenSetList.forEach(function (item) {
        Object.entries(item).forEach(function (_a) {
            var key = _a[0], value = _a[1];
            if (key !== 'name') {
                obj[key] = value;
            }
        });
    });
    return obj;
}
var getComponentTemplateByComponentId = function (handoff, componentId, component) { return __awaiter(void 0, void 0, void 0, function () {
    var parts;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                parts = [];
                component.variantProperties.forEach(function (_a) {
                    var _ = _a[0], value = _a[1];
                    return parts.push(value);
                });
                return [4 /*yield*/, (0, utils_1.getComponentTemplate)(handoff, componentId, parts)];
            case 1: return [2 /*return*/, _a.sent()];
        }
    });
}); };
/**
 * Transforms the component tokens into a preview and code
 */
var transformComponentTokens = function (handoff, componentId, component) { return __awaiter(void 0, void 0, void 0, function () {
    var template, renderableComponent, preview, bodyEl;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!handoff) {
                    throw Error('Handoff not initialized');
                }
                if (!handoff.config.integration) {
                    return [2 /*return*/, null];
                }
                return [4 /*yield*/, getComponentTemplateByComponentId(handoff, componentId, component)];
            case 1:
                template = _a.sent();
                if (!template) {
                    return [2 /*return*/, null];
                }
                renderableComponent = { variant: {}, parts: {} };
                component.variantProperties.forEach(function (_a) {
                    var variantProp = _a[0], value = _a[1];
                    renderableComponent.variant[variantProp] = value;
                });
                if (component.parts) {
                    Object.keys(component.parts).forEach(function (part) {
                        renderableComponent.parts[part] = mergeTokenSets(component.parts[part]);
                    });
                }
                preview = mustache_1.default.render(template, renderableComponent);
                if (handoff.config.app.base_path) {
                    preview = preview.replace(/(?:href|src|ref)=["']([^"']+)["']/g, function (match, capturedGroup) {
                        return match.replace(capturedGroup, handoff.config.app.base_path + capturedGroup);
                    });
                }
                bodyEl = (0, node_html_parser_1.parse)(preview).querySelector('body');
                return [2 /*return*/, {
                        id: component.id,
                        preview: preview,
                        code: bodyEl ? bodyEl.innerHTML.trim() : preview,
                    }];
        }
    });
}); };
/**
 * Transforms the documentation object components into a preview and code
 */
function previewTransformer(handoff, documentationObject) {
    return __awaiter(this, void 0, void 0, function () {
        var components, componentIds, result, previews;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    components = documentationObject.components;
                    componentIds = Object.keys(components);
                    return [4 /*yield*/, Promise.all(componentIds.map(function (componentId) { return __awaiter(_this, void 0, void 0, function () {
                            var _a;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        _a = [componentId];
                                        return [4 /*yield*/, Promise.all(documentationObject.components[componentId].instances.map(function (instance) {
                                                return transformComponentTokens(handoff, componentId, instance);
                                            })).then(function (res) { return res.filter(index_1.filterOutNull); })];
                                    case 1: return [2 /*return*/, _a.concat([
                                            _b.sent()
                                        ])];
                                }
                            });
                        }); }))];
                case 1:
                    result = _a.sent();
                    previews = result.reduce(function (obj, el) {
                        obj[el[0]] = el[1];
                        return obj;
                    }, {});
                    return [2 /*return*/, {
                            components: previews,
                        }];
            }
        });
    });
}
exports.default = previewTransformer;
