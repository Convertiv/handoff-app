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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processSnippet = exports.processSharedStyles = exports.renameSnippet = exports.snippetTransformer = void 0;
var handlebars_1 = __importDefault(require("handlebars"));
var node_html_parser_1 = require("node-html-parser");
var index_1 = require("../../utils/index");
var utils_1 = require("./utils");
var path_1 = __importDefault(require("path"));
var fs_extra_1 = __importDefault(require("fs-extra"));
var sass_1 = __importDefault(require("sass"));
var preview_1 = require("../../utils/preview");
var chalk_1 = __importDefault(require("chalk"));
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
                preview = handlebars_1.default.compile(template)(renderableComponent);
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
 * Create a snippet transformer
 * @param handoff
 * @param documentationObject
 * @returns
 */
function snippetTransformer(handoff) {
    return __awaiter(this, void 0, void 0, function () {
        var custom, publicPath, sharedStyles, files, _i, files_1, file;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    custom = path_1.default.resolve(handoff.workingPath, "integration/snippets");
                    publicPath = path_1.default.resolve(handoff.workingPath, "public/snippets");
                    // ensure public path exists
                    if (!fs_extra_1.default.existsSync(publicPath)) {
                        fs_extra_1.default.mkdirSync(publicPath, { recursive: true });
                    }
                    if (!fs_extra_1.default.existsSync(custom)) return [3 /*break*/, 5];
                    console.log(chalk_1.default.green("Rendering Snippet Previews in ".concat(custom)));
                    return [4 /*yield*/, processSharedStyles(handoff)];
                case 1:
                    sharedStyles = _a.sent();
                    files = fs_extra_1.default.readdirSync(custom);
                    _i = 0, files_1 = files;
                    _a.label = 2;
                case 2:
                    if (!(_i < files_1.length)) return [3 /*break*/, 5];
                    file = files_1[_i];
                    if (!file.endsWith('.html')) return [3 /*break*/, 4];
                    return [4 /*yield*/, processSnippet(handoff, file, sharedStyles)];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5: return [2 /*return*/];
            }
        });
    });
}
exports.snippetTransformer = snippetTransformer;
function renameSnippet(handoff, source, destination) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_c) {
            source = path_1.default.resolve(handoff.workingPath, (_a = handoff.config.integrationPath) !== null && _a !== void 0 ? _a : 'integration', 'snippets', source);
            destination = path_1.default.resolve(handoff.workingPath, (_b = handoff.config.integrationPath) !== null && _b !== void 0 ? _b : 'integration', 'snippets', destination);
            ['html', 'js', 'scss', 'css'].forEach(function (ext) { return __awaiter(_this, void 0, void 0, function () {
                var test;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            console.log("Checking for ".concat(source, ".").concat(ext));
                            test = source.includes(".".concat(ext)) ? source : "".concat(source, ".").concat(ext);
                            if (!fs_extra_1.default.existsSync(test)) return [3 /*break*/, 2];
                            return [4 /*yield*/, fs_extra_1.default.rename(test, destination.includes(".".concat(ext)) ? destination : "".concat(destination, ".").concat(ext))];
                        case 1:
                            _a.sent();
                            _a.label = 2;
                        case 2: return [2 /*return*/];
                    }
                });
            }); });
            return [2 /*return*/];
        });
    });
}
exports.renameSnippet = renameSnippet;
function processSharedStyles(handoff) {
    return __awaiter(this, void 0, void 0, function () {
        var custom, publicPath, scssPath, cssPath, result, css, cssPath_1, e_1, css;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    custom = path_1.default.resolve(handoff.workingPath, "integration/snippets");
                    publicPath = path_1.default.resolve(handoff.workingPath, "public/snippets");
                    scssPath = path_1.default.resolve(custom, 'shared.scss');
                    cssPath = path_1.default.resolve(custom, 'shared.css');
                    if (!(fs_extra_1.default.existsSync(scssPath) && !fs_extra_1.default.existsSync(cssPath))) return [3 /*break*/, 7];
                    console.log(chalk_1.default.green("Compiling shared styles"));
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, , 6]);
                    return [4 /*yield*/, sass_1.default.compileAsync(scssPath, {
                            loadPaths: [
                                path_1.default.resolve(handoff.workingPath, 'integration/sass'),
                                path_1.default.resolve(handoff.workingPath, 'node_modules'),
                                path_1.default.resolve(handoff.workingPath),
                                path_1.default.resolve(handoff.workingPath, 'exported', handoff.config.figma_project_id),
                            ],
                        })];
                case 2:
                    result = _a.sent();
                    if (!result.css) return [3 /*break*/, 4];
                    css = '/* These are the shared styles used in every component. */ \n\n' + result.css;
                    cssPath_1 = path_1.default.resolve(publicPath, 'shared.css');
                    return [4 /*yield*/, fs_extra_1.default.writeFile(cssPath_1, result.css)];
                case 3:
                    _a.sent();
                    return [2 /*return*/, css];
                case 4: return [3 /*break*/, 6];
                case 5:
                    e_1 = _a.sent();
                    console.log(chalk_1.default.red("Error compiling shared styles"));
                    console.log(e_1);
                    return [3 /*break*/, 6];
                case 6: return [3 /*break*/, 9];
                case 7:
                    if (!fs_extra_1.default.existsSync(cssPath)) return [3 /*break*/, 9];
                    return [4 /*yield*/, fs_extra_1.default.readFile(cssPath, 'utf8')];
                case 8:
                    css = _a.sent();
                    return [2 /*return*/, css];
                case 9: return [2 /*return*/];
            }
        });
    });
}
exports.processSharedStyles = processSharedStyles;
function processSnippet(handoff, file, sharedStyles) {
    var _a;
    return __awaiter(this, void 0, void 0, function () {
        var data, custom, publicPath, jsFile, jsPath, js, compiled, e_2, scssFile, scssPath, cssFile, cssPath, result, e_3, scss, css, template, preview, bodyEl, code, publicFile;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    data = {
                        id: file,
                        preview: '',
                        code: '',
                        js: null,
                        css: null,
                        sass: null,
                        sharedStyles: sharedStyles,
                    };
                    console.log(chalk_1.default.green("Processing snippet ".concat(file)));
                    custom = path_1.default.resolve(handoff.workingPath, "integration/snippets");
                    publicPath = path_1.default.resolve(handoff.workingPath, "public/snippets");
                    jsFile = file.replace('.html', '.js');
                    if (!fs_extra_1.default.existsSync(path_1.default.resolve(custom, jsFile))) return [3 /*break*/, 5];
                    console.log(chalk_1.default.green("Detected JS file for ".concat(file)));
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 4, , 5]);
                    jsPath = path_1.default.resolve(custom, jsFile);
                    return [4 /*yield*/, fs_extra_1.default.readFile(jsPath, 'utf8')];
                case 2:
                    js = _b.sent();
                    return [4 /*yield*/, (0, preview_1.bundleJSWebpack)(jsPath, handoff, 'development')];
                case 3:
                    compiled = _b.sent();
                    if (js) {
                        data['js'] = js;
                        data['jsCompiled'] = compiled;
                    }
                    return [3 /*break*/, 5];
                case 4:
                    e_2 = _b.sent();
                    console.log(chalk_1.default.red("Error compiling JS for ".concat(file)));
                    console.log(e_2);
                    return [3 /*break*/, 5];
                case 5:
                    scssFile = file.replace('.html', '.scss');
                    scssPath = path_1.default.resolve(custom, scssFile);
                    cssFile = file.replace('.html', '.css');
                    cssPath = path_1.default.resolve(custom, cssFile);
                    if (!(fs_extra_1.default.existsSync(scssPath) && !fs_extra_1.default.existsSync(cssPath))) return [3 /*break*/, 11];
                    console.log(chalk_1.default.green("Detected SCSS file for ".concat(file)));
                    _b.label = 6;
                case 6:
                    _b.trys.push([6, 8, , 9]);
                    return [4 /*yield*/, sass_1.default.compileAsync(scssPath, {
                            loadPaths: [
                                path_1.default.resolve(handoff.workingPath, (_a = handoff.config.integrationPath) !== null && _a !== void 0 ? _a : 'integration', 'sass'),
                                path_1.default.resolve(handoff.workingPath, 'node_modules'),
                                path_1.default.resolve(handoff.workingPath),
                                path_1.default.resolve(handoff.workingPath, 'exported', handoff.config.figma_project_id),
                            ],
                        })];
                case 7:
                    result = _b.sent();
                    if (result.css) {
                        // @ts-ignore
                        data['css'] = result.css;
                    }
                    return [3 /*break*/, 9];
                case 8:
                    e_3 = _b.sent();
                    console.log(chalk_1.default.red("Error compiling SCSS for ".concat(file)));
                    console.log(e_3);
                    return [3 /*break*/, 9];
                case 9: return [4 /*yield*/, fs_extra_1.default.readFile(scssPath, 'utf8')];
                case 10:
                    scss = _b.sent();
                    if (scss) {
                        data['sass'] = scss;
                    }
                    _b.label = 11;
                case 11:
                    if (!fs_extra_1.default.existsSync(cssPath)) return [3 /*break*/, 13];
                    return [4 /*yield*/, fs_extra_1.default.readFile(path_1.default.resolve(custom, cssFile), 'utf8')];
                case 12:
                    css = _b.sent();
                    if (css) {
                        data['css'] = css;
                    }
                    _b.label = 13;
                case 13: return [4 /*yield*/, fs_extra_1.default.readFile(path_1.default.resolve(custom, file), 'utf8')];
                case 14:
                    template = _b.sent();
                    preview = handlebars_1.default.compile(template)({
                        config: handoff.config,
                        style: data['css'] ? "<style rel=\"stylesheet\" type=\"text/css\">".concat(data['css'], "</style>") : '',
                        script: data['jsCompiled']
                            ? "<script src=\"data:text/javascript;base64,".concat(Buffer.from(data['jsCompiled']).toString('base64'), "\"></script>")
                            : '',
                        sharedStyles: sharedStyles ? "<style rel=\"stylesheet\" type=\"text/css\">".concat(sharedStyles, "</style>") : 'shared',
                    });
                    try {
                        bodyEl = (0, node_html_parser_1.parse)(preview).querySelector('body');
                        code = bodyEl ? bodyEl.innerHTML.trim() : preview;
                        data['preview'] = preview;
                        data['code'] = code;
                        data['sharedStyles'] = sharedStyles;
                    }
                    catch (e) {
                        console.log(e);
                    }
                    publicFile = path_1.default.resolve(publicPath, file);
                    return [4 /*yield*/, fs_extra_1.default.writeFile(publicFile, preview)];
                case 15:
                    _b.sent();
                    return [4 /*yield*/, fs_extra_1.default.writeFile(publicFile.replace('.html', '.json'), JSON.stringify(data, null, 2))];
                case 16:
                    _b.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.processSnippet = processSnippet;
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
