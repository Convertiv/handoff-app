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
var getComponentTemplateByComponentId = function (componentId, component) { return __awaiter(void 0, void 0, void 0, function () {
    var parts;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                parts = component.componentType === 'design'
                    ? __spreadArray(__spreadArray(__spreadArray([], (component.type ? [component.type] : []), true), (component.state ? [component.state] : []), true), (component.activity ? [component.activity] : []), true) : __spreadArray(__spreadArray([], (component.size ? [component.size] : []), true), (component.layout ? [component.layout] : []), true);
                return [4 /*yield*/, utils_1.getComponentTemplate.apply(void 0, __spreadArray([componentId], parts, false))];
            case 1: return [2 /*return*/, _a.sent()];
        }
    });
}); };
/**
 * Transforms the component tokens into a preview and code
 */
var transformComponentTokens = function (componentId, component) { return __awaiter(void 0, void 0, void 0, function () {
    var template, parts, renderableComponent, preview, bodyEl;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, getComponentTemplateByComponentId(componentId, component)];
            case 1:
                template = _a.sent();
                if (!template) {
                    return [2 /*return*/, null];
                }
                parts = {};
                if (component.parts) {
                    Object.keys(component.parts).forEach(function (part) {
                        parts[part] = mergeTokenSets(component.parts[part]);
                    });
                }
                renderableComponent = __assign(__assign({}, component), { parts: parts });
                preview = mustache_1.default.render(template, renderableComponent);
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
function previewTransformer(documentationObject) {
    return __awaiter(this, void 0, void 0, function () {
        var components, componenetIds, result, previews;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    components = documentationObject.components;
                    componenetIds = Object.keys(components);
                    return [4 /*yield*/, Promise.all(componenetIds.map(function (componentId) { return __awaiter(_this, void 0, void 0, function () {
                            var _a;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        _a = [componentId];
                                        return [4 /*yield*/, Promise.all(documentationObject.components[componentId].map(function (component) { return transformComponentTokens(componentId, component); })).then(function (res) { return res.filter(index_1.filterOutNull); })];
                                    case 1: return [2 /*return*/, _a.concat([_b.sent()])];
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
