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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processSnippet = exports.processSharedStyles = exports.renameSnippet = exports.snippetTransformer = void 0;
var path_1 = __importDefault(require("path"));
var fs_extra_1 = __importDefault(require("fs-extra"));
var sass_1 = __importDefault(require("sass"));
var preview_1 = require("../../utils/preview");
var chalk_1 = __importDefault(require("chalk"));
var node_html_parser_1 = require("node-html-parser");
var handlebars_1 = __importDefault(require("handlebars"));
var semver_1 = __importDefault(require("semver"));
var SlotType;
(function (SlotType) {
    SlotType["STRING"] = "string";
    SlotType["IMAGE"] = "image";
})(SlotType || (SlotType = {}));
/**
 * Create a snippet transformer
 * @param handoff
 * @param documentationObject
 * @returns
 */
function snippetTransformer(handoff) {
    return __awaiter(this, void 0, void 0, function () {
        var custom, publicPath, publicAPIPath, sharedStyles, files, componentData, _i, files_1, file, latest, versions, data, versionDirectories, _a, versionDirectories_1, versionDirectory, versionFiles, _b, versionFiles_1, versionFile, name_1;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    custom = path_1.default.resolve(handoff.workingPath, "integration/snippets");
                    publicPath = path_1.default.resolve(handoff.workingPath, "public/snippets");
                    publicAPIPath = path_1.default.resolve(handoff.workingPath, "public/api/component");
                    // ensure public path exists
                    if (!fs_extra_1.default.existsSync(publicPath)) {
                        fs_extra_1.default.mkdirSync(publicPath, { recursive: true });
                    }
                    if (!fs_extra_1.default.existsSync(custom)) return [3 /*break*/, 15];
                    console.log(chalk_1.default.green("Rendering Snippet Previews in ".concat(custom)));
                    return [4 /*yield*/, processSharedStyles(handoff)];
                case 1:
                    sharedStyles = _c.sent();
                    files = fs_extra_1.default.readdirSync(custom);
                    componentData = {};
                    _i = 0, files_1 = files;
                    _c.label = 2;
                case 2:
                    if (!(_i < files_1.length)) return [3 /*break*/, 14];
                    file = files_1[_i];
                    latest = undefined;
                    versions = {};
                    data = undefined;
                    if (!file.endsWith('.html')) return [3 /*break*/, 4];
                    return [4 /*yield*/, processSnippet(handoff, file, sharedStyles)];
                case 3:
                    data = _c.sent();
                    // Write the API file
                    // we're in the root directory so this must be version 0.
                    versions['v0.0.0'] = data;
                    if (!latest) {
                        versions['latest'] = data;
                        versions['version'] = 'v0.0.0';
                    }
                    return [3 /*break*/, 12];
                case 4:
                    if (!fs_extra_1.default.lstatSync(path_1.default.resolve(custom, file)).isDirectory()) return [3 /*break*/, 12];
                    versionDirectories = fs_extra_1.default.readdirSync(path_1.default.resolve(custom, file));
                    _a = 0, versionDirectories_1 = versionDirectories;
                    _c.label = 5;
                case 5:
                    if (!(_a < versionDirectories_1.length)) return [3 /*break*/, 12];
                    versionDirectory = versionDirectories_1[_a];
                    if (!semver_1.default.valid(versionDirectory)) return [3 /*break*/, 10];
                    versionFiles = fs_extra_1.default.readdirSync(path_1.default.resolve(custom, file, versionDirectory));
                    _b = 0, versionFiles_1 = versionFiles;
                    _c.label = 6;
                case 6:
                    if (!(_b < versionFiles_1.length)) return [3 /*break*/, 9];
                    versionFile = versionFiles_1[_b];
                    console.log("Processing version ".concat(versionDirectory, " for ").concat(file));
                    if (!versionFile.endsWith('.html')) return [3 /*break*/, 8];
                    return [4 /*yield*/, processSnippet(handoff, versionFile, sharedStyles, path_1.default.join(file, versionDirectory))];
                case 7:
                    data = _c.sent();
                    versions[versionDirectory] = data;
                    if (!latest || semver_1.default.gt(versionDirectory, latest)) {
                        versions['latest'] = data;
                        versions['version'] = versionDirectory;
                    }
                    _c.label = 8;
                case 8:
                    _b++;
                    return [3 /*break*/, 6];
                case 9: return [3 /*break*/, 11];
                case 10:
                    console.error("Invalid version directory ".concat(versionDirectory));
                    _c.label = 11;
                case 11:
                    _a++;
                    return [3 /*break*/, 5];
                case 12:
                    if (data) {
                        name_1 = file.replace('.html', '');
                        if (componentData[name_1]) {
                            // merge the versions
                            componentData[name_1] = __assign(__assign({}, componentData[name_1]), versions);
                        }
                        else {
                            componentData[name_1] = versions;
                        }
                    }
                    _c.label = 13;
                case 13:
                    _i++;
                    return [3 /*break*/, 2];
                case 14:
                    buildPreviewAPI(handoff, componentData);
                    _c.label = 15;
                case 15: return [2 /*return*/];
            }
        });
    });
}
exports.snippetTransformer = snippetTransformer;
/**
 * A utility function to rename a snippet
 * @param handoff
 * @param source
 * @param destination
 */
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
/**
 * Process the shared styles with sass compileAsync
 * @param handoff
 * @returns
 */
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
/**
 * Process process a specific snippet
 * @param handoff
 * @param file
 * @param sharedStyles
 */
function processSnippet(handoff, file, sharedStyles, sub) {
    var _a, _b, _c;
    return __awaiter(this, void 0, void 0, function () {
        var data, custom, publicPath, jsonFile, jsonPath, parsed, json, jsFile, jsPath, js, compiled, e_2, scssFile, scssPath, cssFile, cssPath, result, e_3, scss, css, template, previews, _d, _e, _i, previewKey, url, publicFile, bodyEl, code, e_4, splitCSS;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    data = {
                        id: file,
                        title: 'Untitled',
                        description: 'No description provided',
                        preview: 'No preview available',
                        previews: [
                            {
                                title: 'Default',
                                values: {},
                                url: file,
                            },
                        ],
                        slots: {},
                        code: '',
                        js: null,
                        css: null,
                        sass: null,
                        sharedStyles: sharedStyles,
                    };
                    console.log(chalk_1.default.green("Processing snippet ".concat(file)));
                    if (!sub)
                        sub = '';
                    custom = path_1.default.resolve(handoff.workingPath, "integration/snippets", sub);
                    publicPath = path_1.default.resolve(handoff.workingPath, "public/api/component");
                    // Ensure the public API path exists
                    if (!fs_extra_1.default.existsSync(publicPath)) {
                        fs_extra_1.default.mkdirSync(publicPath, { recursive: true });
                    }
                    jsonFile = file.replace('.html', '.json');
                    jsonPath = path_1.default.resolve(custom, jsonFile);
                    parsed = {};
                    if (!fs_extra_1.default.existsSync(jsonPath)) return [3 /*break*/, 2];
                    return [4 /*yield*/, fs_extra_1.default.readFile(jsonPath, 'utf8')];
                case 1:
                    json = _f.sent();
                    if (json) {
                        try {
                            parsed = JSON.parse(json);
                            // The JSON file defines each of the fields
                            if (parsed) {
                                data.title = parsed.title;
                                data.description = parsed.description;
                                data.slots = parsed.slots;
                                data.previews = parsed.previews;
                            }
                        }
                        catch (e) {
                            console.log(chalk_1.default.red("Error parsing JSON for ".concat(file)));
                            console.log(e);
                        }
                    }
                    _f.label = 2;
                case 2:
                    jsFile = file.replace('.html', '.js');
                    if (!fs_extra_1.default.existsSync(path_1.default.resolve(custom, jsFile))) return [3 /*break*/, 7];
                    console.log(chalk_1.default.green("Detected JS file for ".concat(file)));
                    _f.label = 3;
                case 3:
                    _f.trys.push([3, 6, , 7]);
                    jsPath = path_1.default.resolve(custom, jsFile);
                    return [4 /*yield*/, fs_extra_1.default.readFile(jsPath, 'utf8')];
                case 4:
                    js = _f.sent();
                    return [4 /*yield*/, (0, preview_1.bundleJSWebpack)(jsPath, handoff, 'development')];
                case 5:
                    compiled = _f.sent();
                    if (js) {
                        data.js = js;
                        data['jsCompiled'] = compiled;
                    }
                    return [3 /*break*/, 7];
                case 6:
                    e_2 = _f.sent();
                    console.log(chalk_1.default.red("Error compiling JS for ".concat(file)));
                    console.log(e_2);
                    return [3 /*break*/, 7];
                case 7:
                    scssFile = file.replace('.html', '.scss');
                    scssPath = path_1.default.resolve(custom, scssFile);
                    cssFile = file.replace('.html', '.css');
                    cssPath = path_1.default.resolve(custom, cssFile);
                    if (!(fs_extra_1.default.existsSync(scssPath) && !fs_extra_1.default.existsSync(cssPath))) return [3 /*break*/, 13];
                    console.log(chalk_1.default.green("Detected SCSS file for ".concat(file)));
                    _f.label = 8;
                case 8:
                    _f.trys.push([8, 10, , 11]);
                    return [4 /*yield*/, sass_1.default.compileAsync(scssPath, {
                            loadPaths: [
                                path_1.default.resolve(handoff.workingPath, (_a = handoff.config.integrationPath) !== null && _a !== void 0 ? _a : 'integration', 'sass'),
                                path_1.default.resolve(handoff.workingPath, 'node_modules'),
                                path_1.default.resolve(handoff.workingPath),
                                path_1.default.resolve(handoff.workingPath, 'exported', handoff.config.figma_project_id),
                            ],
                        })];
                case 9:
                    result = _f.sent();
                    if (result.css) {
                        // @ts-ignore
                        data['css'] = result.css;
                    }
                    return [3 /*break*/, 11];
                case 10:
                    e_3 = _f.sent();
                    console.log(chalk_1.default.red("Error compiling SCSS for ".concat(file)));
                    console.log(e_3);
                    return [3 /*break*/, 11];
                case 11: return [4 /*yield*/, fs_extra_1.default.readFile(scssPath, 'utf8')];
                case 12:
                    scss = _f.sent();
                    if (scss) {
                        data['sass'] = scss;
                    }
                    _f.label = 13;
                case 13:
                    if (!fs_extra_1.default.existsSync(cssPath)) return [3 /*break*/, 15];
                    return [4 /*yield*/, fs_extra_1.default.readFile(path_1.default.resolve(custom, cssFile), 'utf8')];
                case 14:
                    css = _f.sent();
                    if (css) {
                        data['css'] = css;
                    }
                    _f.label = 15;
                case 15: return [4 /*yield*/, fs_extra_1.default.readFile(path_1.default.resolve(custom, file), 'utf8')];
                case 16:
                    template = _f.sent();
                    _f.label = 17;
                case 17:
                    _f.trys.push([17, 22, , 23]);
                    previews = {};
                    _d = [];
                    for (_e in data.previews)
                        _d.push(_e);
                    _i = 0;
                    _f.label = 18;
                case 18:
                    if (!(_i < _d.length)) return [3 /*break*/, 21];
                    previewKey = _d[_i];
                    url = file.replace('.html', "-".concat(previewKey, ".html"));
                    data.previews[previewKey].url = url;
                    publicFile = path_1.default.resolve(publicPath, url);
                    previews[previewKey] = handlebars_1.default.compile(template)({
                        config: handoff.config,
                        style: data['css'] ? "<style rel=\"stylesheet\" type=\"text/css\">".concat(data['css'], "</style>") : '',
                        script: data['jsCompiled']
                            ? "<script src=\"data:text/javascript;base64,".concat(Buffer.from(data['jsCompiled']).toString('base64'), "\"></script>")
                            : '',
                        sharedStyles: sharedStyles ? "<style rel=\"stylesheet\" type=\"text/css\">".concat(sharedStyles, "</style>") : 'shared',
                        slot: ((_b = data.previews[previewKey]) === null || _b === void 0 ? void 0 : _b.values) || {},
                    });
                    return [4 /*yield*/, fs_extra_1.default.writeFile(publicFile, previews[previewKey])];
                case 19:
                    _f.sent();
                    _f.label = 20;
                case 20:
                    _i++;
                    return [3 /*break*/, 18];
                case 21:
                    data.preview = '';
                    bodyEl = (0, node_html_parser_1.parse)(template).querySelector('body');
                    code = bodyEl ? bodyEl.innerHTML.trim() : template;
                    data['code'] = code;
                    data['sharedStyles'] = sharedStyles;
                    return [3 /*break*/, 23];
                case 22:
                    e_4 = _f.sent();
                    console.log(e_4);
                    // write the preview to the public folder
                    throw new Error('stop');
                case 23:
                    splitCSS = (_c = data['css']) === null || _c === void 0 ? void 0 : _c.split('/* COMPONENT STYLES*/');
                    // If there are two parts, the first part is the shared styles
                    if (splitCSS && splitCSS.length > 1) {
                        data['css'] = splitCSS[1];
                        data['sharedStyles'] = splitCSS[0];
                    }
                    return [2 /*return*/, data];
            }
        });
    });
}
exports.processSnippet = processSnippet;
var buildPreviewAPI = function (handoff, componentData) { return __awaiter(void 0, void 0, void 0, function () {
    var publicPath, files, output, _a, _b, _i, component, latest;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                publicPath = path_1.default.resolve(handoff.workingPath, "public/api/component");
                files = fs_extra_1.default.readdirSync(publicPath);
                output = [];
                _a = [];
                for (_b in componentData)
                    _a.push(_b);
                _i = 0;
                _c.label = 1;
            case 1:
                if (!(_i < _a.length)) return [3 /*break*/, 4];
                component = _a[_i];
                latest = componentData[component]['latest'];
                if (latest) {
                    // read the file
                    output.push({
                        id: component,
                        version: componentData[component]['version'],
                        title: latest.title,
                        description: latest.description,
                        slots: latest.slots,
                    });
                }
                else {
                    console.log("No latest version found for ".concat(component));
                }
                return [4 /*yield*/, fs_extra_1.default.writeFile(path_1.default.resolve(publicPath, "".concat(component, ".json")), JSON.stringify(componentData[component], null, 2))];
            case 2:
                _c.sent();
                _c.label = 3;
            case 3:
                _i++;
                return [3 /*break*/, 1];
            case 4: return [4 /*yield*/, fs_extra_1.default.writeFile(publicPath + 's.json', JSON.stringify(output, null, 2))];
            case 5:
                _c.sent();
                return [2 /*return*/];
        }
    });
}); };
