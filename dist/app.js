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
exports.devApp = exports.watchApp = void 0;
var next_build_1 = require("next/dist/cli/next-build");
var next_dev_1 = require("next/dist/cli/next-dev");
var path_1 = __importDefault(require("path"));
var http_1 = require("http");
var url_1 = require("url");
var next_1 = __importDefault(require("next"));
var fs_extra_1 = __importDefault(require("fs-extra"));
var chokidar_1 = __importDefault(require("chokidar"));
var chalk_1 = __importDefault(require("chalk"));
var gray_matter_1 = __importDefault(require("gray-matter"));
var preview_1 = require("./utils/preview");
var preview_2 = require("./transformers/preview");
var pipeline_1 = require("./pipeline");
var getWorkingPublicPath = function (handoff) {
    var paths = [
        path_1.default.resolve(handoff.workingPath, "public-".concat(handoff.config.figma_project_id)),
        path_1.default.resolve(handoff.workingPath, "public"),
    ];
    for (var _i = 0, paths_1 = paths; _i < paths_1.length; _i++) {
        var path_2 = paths_1[_i];
        if (fs_extra_1.default.existsSync(path_2)) {
            return path_2;
        }
    }
    return null;
};
var getAppPath = function (handoff) {
    return path_1.default.resolve(handoff.modulePath, '.handoff', "".concat(handoff.config.figma_project_id));
};
/**
 * Copy the public dir from the working dir to the module dir
 * @param handoff
 */
var mergePublicDir = function (handoff) { return __awaiter(void 0, void 0, void 0, function () {
    var appPath, workingPublicPath;
    return __generator(this, function (_a) {
        appPath = getAppPath(handoff);
        workingPublicPath = getWorkingPublicPath(handoff);
        if (workingPublicPath) {
            fs_extra_1.default.copySync(workingPublicPath, path_1.default.resolve(appPath, 'public'), { overwrite: true });
        }
        return [2 /*return*/];
    });
}); };
/**
 * Copy the mdx files from the working dir to the module dir
 * @param handoff
 */
var mergeMDX = function (handoff) { return __awaiter(void 0, void 0, void 0, function () {
    var appPath, pages, files, _i, files_1, file, subFiles, _a, subFiles_1, subFile, target, thirdFiles, _b, thirdFiles_1, thirdFile, target;
    return __generator(this, function (_c) {
        console.log(chalk_1.default.yellow('Merging MDX files...'));
        appPath = getAppPath(handoff);
        pages = path_1.default.resolve(handoff.workingPath, "pages");
        if (fs_extra_1.default.existsSync(pages)) {
            files = fs_extra_1.default.readdirSync(pages);
            for (_i = 0, files_1 = files; _i < files_1.length; _i++) {
                file = files_1[_i];
                if (file.endsWith('.mdx')) {
                    // transform the file
                    transformMdx(path_1.default.resolve(pages, file), path_1.default.resolve(appPath, 'pages', file), file.replace('.mdx', ''));
                }
                else if (fs_extra_1.default.lstatSync(path_1.default.resolve(pages, file)).isDirectory()) {
                    subFiles = fs_extra_1.default.readdirSync(path_1.default.resolve(pages, file));
                    for (_a = 0, subFiles_1 = subFiles; _a < subFiles_1.length; _a++) {
                        subFile = subFiles_1[_a];
                        if (subFile.endsWith('.mdx')) {
                            target = path_1.default.resolve(appPath, 'pages', file);
                            if (!fs_extra_1.default.existsSync(target)) {
                                fs_extra_1.default.mkdirSync(target, { recursive: true });
                            }
                            transformMdx(path_1.default.resolve(pages, file, subFile), path_1.default.resolve(appPath, 'pages', file, subFile), file);
                        }
                        else if (fs_extra_1.default.lstatSync(path_1.default.resolve(pages, file, subFile)).isDirectory()) {
                            thirdFiles = fs_extra_1.default.readdirSync(path_1.default.resolve(pages, file, subFile));
                            for (_b = 0, thirdFiles_1 = thirdFiles; _b < thirdFiles_1.length; _b++) {
                                thirdFile = thirdFiles_1[_b];
                                if (thirdFile.endsWith('.mdx')) {
                                    target = path_1.default.resolve(appPath, 'pages', file, subFile);
                                    if (!fs_extra_1.default.existsSync(target)) {
                                        fs_extra_1.default.mkdirSync(target, { recursive: true });
                                    }
                                    transformMdx(path_1.default.resolve(pages, file, subFile, thirdFile), path_1.default.resolve(appPath, 'pages', file, subFile, thirdFile), file);
                                }
                            }
                        }
                    }
                }
            }
        }
        return [2 /*return*/];
    });
}); };
/**
 * Remove the frontmatter from the mdx file, convert it to an import, and
 * add the metadata to the export.  Then write the file to the destination.
 * @param src
 * @param dest
 * @param id
 */
var transformMdx = function (src, dest, id) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    var content = fs_extra_1.default.readFileSync(src);
    var _j = (0, gray_matter_1.default)(content), data = _j.data, body = _j.content;
    var mdx = body;
    var title = (_a = data.title) !== null && _a !== void 0 ? _a : '';
    var menu = (_b = data.menu) !== null && _b !== void 0 ? _b : '';
    var description = data.description ? data.description.replace(/(\r\n|\n|\r)/gm, '') : '';
    var metaDescription = (_c = data.metaDescription) !== null && _c !== void 0 ? _c : '';
    var metaTitle = (_d = data.metaTitle) !== null && _d !== void 0 ? _d : '';
    var weight = (_e = data.weight) !== null && _e !== void 0 ? _e : 0;
    var image = (_f = data.image) !== null && _f !== void 0 ? _f : '';
    var menuTitle = (_g = data.menuTitle) !== null && _g !== void 0 ? _g : '';
    var enabled = (_h = data.enabled) !== null && _h !== void 0 ? _h : true;
    var wide = data.wide ? 'true' : 'false';
    //
    mdx = "\n\n\n".concat(mdx, "\n\n\nimport {staticBuildMenu, getCurrentSection} from \"handoff-app/src/app/components/util\";\nimport { getClientConfig } from '@handoff/config';\nimport { getPreview } from \"handoff-app/src/app/components/util\";\n\nexport const getStaticProps = async () => {\n  // get previews for components on this page\n  const previews = getPreview();\n  const menu = staticBuildMenu();\n  const config = getClientConfig();\n  return {\n    props: {\n      previews,\n      menu,\n      config,\n      current: getCurrentSection(menu, \"/").concat(id, "\") ?? [],\n      title: \"").concat(title, "\",\n      description: \"").concat(description, "\",\n      image: \"").concat(image, "\",\n    },\n  };\n};\n\nexport const preview = (name) => {\n  return previews.components[name];\n};\n\nimport MarkdownLayout from \"handoff-app/src/app/components/MarkdownLayout\";\nexport default function Layout(props) {\n  return (\n    <MarkdownLayout\n      menu={props.menu}\n      metadata={{\n        metaDescription: \"").concat(metaDescription, "\",\n        metaTitle: \"").concat(metaTitle, "\",\n        title: \"").concat(title, "\",\n        weight: ").concat(weight, ",\n        image: \"").concat(image, "\",\n        menuTitle: \"").concat(menuTitle, "\",\n        enabled: ").concat(enabled, ",\n      }}\n      wide={").concat(wide, "}\n      allPreviews={props.previews}\n      config={props.config}\n      current={props.current}\n    >\n      {props.children}\n    </MarkdownLayout>\n  );\n\n}");
    fs_extra_1.default.writeFileSync(dest, mdx, 'utf-8');
};
var performCleanup = function (handoff) { return __awaiter(void 0, void 0, void 0, function () {
    var appPath;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                appPath = getAppPath(handoff);
                if (!fs_extra_1.default.existsSync(appPath)) return [3 /*break*/, 2];
                return [4 /*yield*/, fs_extra_1.default.rm(appPath, { recursive: true })];
            case 1:
                _a.sent();
                _a.label = 2;
            case 2: return [2 /*return*/];
        }
    });
}); };
var prepareProjectApp = function (handoff) { return __awaiter(void 0, void 0, void 0, function () {
    var srcPath, appPath, handoffProjectId, handoffAppBasePath, handoffWorkingPath, handoffIntegrationPath, handoffModulePath, handoffExportPath, nextConfigPath, handoffUseReferences, nextConfigContent;
    var _a, _b, _c, _d;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                srcPath = path_1.default.resolve(handoff.modulePath, 'src', 'app');
                appPath = getAppPath(handoff);
                // Prepare project app dir
                return [4 /*yield*/, fs_extra_1.default.promises.mkdir(appPath, { recursive: true })];
            case 1:
                // Prepare project app dir
                _e.sent();
                return [4 /*yield*/, fs_extra_1.default.copy(srcPath, appPath, { overwrite: true })];
            case 2:
                _e.sent();
                return [4 /*yield*/, mergePublicDir(handoff)];
            case 3:
                _e.sent();
                return [4 /*yield*/, mergeMDX(handoff)];
            case 4:
                _e.sent();
                handoffProjectId = (_a = handoff.config.figma_project_id) !== null && _a !== void 0 ? _a : '';
                handoffAppBasePath = (_b = handoff.config.app.base_path) !== null && _b !== void 0 ? _b : '';
                handoffWorkingPath = path_1.default.resolve(handoff.workingPath);
                handoffIntegrationPath = path_1.default.resolve(handoff.workingPath, (_c = handoff.config.integrationPath) !== null && _c !== void 0 ? _c : 'integration');
                handoffModulePath = path_1.default.resolve(handoff.modulePath);
                handoffExportPath = path_1.default.resolve(handoff.workingPath, handoff.exportsDirectory, handoff.config.figma_project_id);
                nextConfigPath = path_1.default.resolve(appPath, 'next.config.mjs');
                handoffUseReferences = (_d = handoff.config.useVariables) !== null && _d !== void 0 ? _d : false;
                return [4 /*yield*/, fs_extra_1.default.readFile(nextConfigPath, 'utf-8')];
            case 5:
                nextConfigContent = (_e.sent())
                    .replace(/basePath:\s+\'\'/g, "basePath: '".concat(handoffAppBasePath, "'"))
                    .replace(/HANDOFF_PROJECT_ID:\s+\'\'/g, "HANDOFF_PROJECT_ID: '".concat(handoffProjectId, "'"))
                    .replace(/HANDOFF_APP_BASE_PATH:\s+\'\'/g, "HANDOFF_APP_BASE_PATH: '".concat(handoffAppBasePath, "'"))
                    .replace(/HANDOFF_WORKING_PATH:\s+\'\'/g, "HANDOFF_WORKING_PATH: '".concat(handoffWorkingPath, "'"))
                    .replace(/HANDOFF_INTEGRATION_PATH:\s+\'\'/g, "HANDOFF_INTEGRATION_PATH: '".concat(handoffIntegrationPath, "'"))
                    .replace(/HANDOFF_MODULE_PATH:\s+\'\'/g, "HANDOFF_MODULE_PATH: '".concat(handoffModulePath, "'"))
                    .replace(/HANDOFF_EXPORT_PATH:\s+\'\'/g, "HANDOFF_EXPORT_PATH: '".concat(handoffExportPath, "'"))
                    .replace(/HANDOFF_USE_REFERENCES:\s+\'\'/g, "HANDOFF_USE_REFERENCES: '".concat(handoffUseReferences, "'"))
                    .replace(/%HANDOFF_MODULE_PATH%/g, handoffModulePath);
                return [4 /*yield*/, fs_extra_1.default.writeFile(nextConfigPath, nextConfigContent)];
            case 6:
                _e.sent();
                return [2 /*return*/, appPath];
        }
    });
}); };
/**
 * Build the next js application
 * @param handoff
 * @returns
 */
var buildApp = function (handoff) { return __awaiter(void 0, void 0, void 0, function () {
    var appPath, outputRoot, output;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!fs_extra_1.default.existsSync(path_1.default.resolve(handoff.workingPath, handoff.exportsDirectory, handoff.config.figma_project_id, 'tokens.json'))) {
                    throw new Error('Tokens not exported. Run `handoff-app fetch` first.');
                }
                // Perform cleanup
                return [4 /*yield*/, performCleanup(handoff)];
            case 1:
                // Perform cleanup
                _a.sent();
                // If we are building the app, ensure the integration is built first
                return [4 /*yield*/, (0, pipeline_1.buildIntegrationOnly)(handoff)];
            case 2:
                // If we are building the app, ensure the integration is built first
                _a.sent();
                // Build client preview styles
                return [4 /*yield*/, (0, preview_1.buildClientFiles)(handoff)
                        .then(function (value) { return !!value && console.log(chalk_1.default.green(value)); })
                        .catch(function (error) {
                        throw new Error(error);
                    })];
            case 3:
                // Build client preview styles
                _a.sent();
                return [4 /*yield*/, prepareProjectApp(handoff)];
            case 4:
                appPath = _a.sent();
                // Build app
                return [4 /*yield*/, (0, next_build_1.nextBuild)({
                        lint: true,
                        mangling: true,
                        experimentalDebugMemoryUsage: false,
                        experimentalAppOnly: false,
                        experimentalTurbo: false,
                        experimentalBuildMode: 'default',
                    }, appPath)];
            case 5:
                // Build app
                _a.sent();
                outputRoot = path_1.default.resolve(handoff.workingPath, handoff.sitesDirectory);
                if (!fs_extra_1.default.existsSync(outputRoot)) {
                    fs_extra_1.default.mkdirSync(outputRoot, { recursive: true });
                }
                output = path_1.default.resolve(outputRoot, handoff.config.figma_project_id);
                if (fs_extra_1.default.existsSync(output)) {
                    fs_extra_1.default.removeSync(output);
                }
                // Copy the build files into the project output directory
                fs_extra_1.default.copySync(path_1.default.resolve(appPath, 'out'), output);
                return [2 /*return*/];
        }
    });
}); };
/**
 * Watch the next js application
 * @param handoff
 */
var watchApp = function (handoff) { return __awaiter(void 0, void 0, void 0, function () {
    var appPath, dev, hostname, port, app, handle, moduleOutput, chokidarConfig, debounce;
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                if (!fs_extra_1.default.existsSync(path_1.default.resolve(handoff.workingPath, handoff.exportsDirectory, handoff.config.figma_project_id, 'tokens.json'))) {
                    throw new Error('Tokens not exported. Run `handoff-app fetch` first.');
                }
                // Build client preview styles
                return [4 /*yield*/, (0, preview_1.buildClientFiles)(handoff)
                        .then(function (value) { return !!value && console.log(chalk_1.default.green(value)); })
                        .catch(function (error) {
                        throw new Error(error);
                    })];
            case 1:
                // Build client preview styles
                _c.sent();
                return [4 /*yield*/, prepareProjectApp(handoff)];
            case 2:
                appPath = _c.sent();
                // Include any changes made within the app source during watch
                chokidar_1.default
                    .watch(path_1.default.resolve(handoff.modulePath, 'src', 'app'), {
                    ignored: /(^|[\/\\])\../,
                    persistent: true,
                    ignoreInitial: true,
                })
                    .on('all', function (event, path) { return __awaiter(void 0, void 0, void 0, function () {
                    var _a;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0:
                                _a = event;
                                switch (_a) {
                                    case 'add': return [3 /*break*/, 1];
                                    case 'change': return [3 /*break*/, 1];
                                    case 'unlink': return [3 /*break*/, 1];
                                }
                                return [3 /*break*/, 3];
                            case 1: return [4 /*yield*/, prepareProjectApp(handoff)];
                            case 2:
                                _b.sent();
                                return [3 /*break*/, 3];
                            case 3: return [2 /*return*/];
                        }
                    });
                }); });
                dev = true;
                hostname = 'localhost';
                port = 3000;
                app = (0, next_1.default)({
                    dev: dev,
                    dir: appPath,
                    hostname: hostname,
                    port: port,
                    // conf: config,
                });
                handle = app.getRequestHandler();
                moduleOutput = path_1.default.resolve(appPath, 'out');
                if (fs_extra_1.default.existsSync(moduleOutput)) {
                    fs_extra_1.default.removeSync(moduleOutput);
                }
                app.prepare().then(function () {
                    (0, http_1.createServer)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
                        var parsedUrl, pathname, query, err_1;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    // Be sure to pass `true` as the second argument to `url.parse`.
                                    // This tells it to parse the query portion of the URL.
                                    if (!req.url)
                                        throw new Error('No url');
                                    parsedUrl = (0, url_1.parse)(req.url, true);
                                    pathname = parsedUrl.pathname, query = parsedUrl.query;
                                    return [4 /*yield*/, handle(req, res, parsedUrl)];
                                case 1:
                                    _a.sent();
                                    return [3 /*break*/, 3];
                                case 2:
                                    err_1 = _a.sent();
                                    console.error('Error occurred handling', req.url, err_1);
                                    res.statusCode = 500;
                                    res.end('internal server error');
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); })
                        .once('error', function (err) {
                        console.error(err);
                        process.exit(1);
                    })
                        .listen(port, function () {
                        console.log("> Ready on http://".concat(hostname, ":").concat(port));
                    });
                });
                chokidarConfig = {
                    ignored: /(^|[\/\\])\../,
                    persistent: true,
                    ignoreInitial: true,
                };
                debounce = false;
                if (fs_extra_1.default.existsSync(path_1.default.resolve(handoff.workingPath, 'exportables'))) {
                    chokidar_1.default.watch(path_1.default.resolve(handoff.workingPath, 'exportables'), chokidarConfig).on('all', function (event, path) { return __awaiter(void 0, void 0, void 0, function () {
                        var _a;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    _a = event;
                                    switch (_a) {
                                        case 'add': return [3 /*break*/, 1];
                                        case 'change': return [3 /*break*/, 1];
                                        case 'unlink': return [3 /*break*/, 1];
                                    }
                                    return [3 /*break*/, 4];
                                case 1:
                                    if (!(path.includes('json') && !debounce)) return [3 /*break*/, 3];
                                    console.log(chalk_1.default.yellow('Exportables changed. Handoff will fetch new tokens...'));
                                    debounce = true;
                                    return [4 /*yield*/, handoff.fetch()];
                                case 2:
                                    _b.sent();
                                    debounce = false;
                                    _b.label = 3;
                                case 3: return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                }
                if (fs_extra_1.default.existsSync(path_1.default.resolve(handoff.workingPath, 'public'))) {
                    chokidar_1.default.watch(path_1.default.resolve(handoff.workingPath, 'public'), chokidarConfig).on('all', function (event, path) { return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (event) {
                                case 'add':
                                case 'change':
                                case 'unlink':
                                    console.log(chalk_1.default.yellow('Public directory changed. Handoff will ingest the new data...'));
                                    mergePublicDir(handoff);
                                    break;
                            }
                            return [2 /*return*/];
                        });
                    }); });
                }
                if (fs_extra_1.default.existsSync(path_1.default.resolve(handoff.workingPath, (_a = handoff.config.integrationPath) !== null && _a !== void 0 ? _a : 'integration'))) {
                    chokidar_1.default.watch(path_1.default.resolve(handoff.workingPath, (_b = handoff.config.integrationPath) !== null && _b !== void 0 ? _b : 'integration'), chokidarConfig).on('all', function (event, file) { return __awaiter(void 0, void 0, void 0, function () {
                        var _a, sharedStyles;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    _a = event;
                                    switch (_a) {
                                        case 'add': return [3 /*break*/, 1];
                                        case 'change': return [3 /*break*/, 1];
                                        case 'unlink': return [3 /*break*/, 1];
                                    }
                                    return [3 /*break*/, 8];
                                case 1:
                                    if (!((file.includes('json') || file.includes('html') || file.includes('js') || file.includes('scss')) && !debounce)) return [3 /*break*/, 7];
                                    console.log(chalk_1.default.yellow("Integration ".concat(event, "ed. Handoff will rerender the integrations...")), file);
                                    debounce = true;
                                    if (!file.includes('snippet')) return [3 /*break*/, 4];
                                    return [4 /*yield*/, (0, preview_2.processSharedStyles)(handoff)];
                                case 2:
                                    sharedStyles = _b.sent();
                                    return [4 /*yield*/, (0, preview_2.processSnippet)(handoff, path_1.default.basename(file), sharedStyles)];
                                case 3:
                                    _b.sent();
                                    return [3 /*break*/, 6];
                                case 4: return [4 /*yield*/, handoff.integration()];
                                case 5:
                                    _b.sent();
                                    _b.label = 6;
                                case 6:
                                    debounce = false;
                                    _b.label = 7;
                                case 7: return [3 /*break*/, 8];
                                case 8: return [2 /*return*/];
                            }
                        });
                    }); });
                }
                if (fs_extra_1.default.existsSync(path_1.default.resolve(handoff.workingPath, 'pages'))) {
                    chokidar_1.default.watch(path_1.default.resolve(handoff.workingPath, 'pages'), chokidarConfig).on('all', function (event, path) { return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (event) {
                                case 'add':
                                case 'change':
                                case 'unlink':
                                    if (path.endsWith('.mdx')) {
                                        mergeMDX(handoff);
                                    }
                                    console.log(chalk_1.default.yellow("Doc page ".concat(event, "ed. Please reload browser to see changes...")), path);
                                    break;
                            }
                            return [2 /*return*/];
                        });
                    }); });
                }
                if (fs_extra_1.default.existsSync(path_1.default.resolve(handoff.workingPath, 'handoff.config.json'))) {
                    chokidar_1.default.watch(path_1.default.resolve(handoff.workingPath, 'handoff.config.json'), { ignoreInitial: true }).on('all', function (event, path) { return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            console.log(chalk_1.default.yellow('handoff.config.json changed. Please restart server to see changes...'));
                            return [2 /*return*/];
                        });
                    }); });
                }
                return [2 /*return*/];
        }
    });
}); };
exports.watchApp = watchApp;
/**
 * Watch the next js application
 * @param handoff
 */
var devApp = function (handoff) { return __awaiter(void 0, void 0, void 0, function () {
    var appPath, moduleOutput;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!fs_extra_1.default.existsSync(path_1.default.resolve(handoff.workingPath, handoff.exportsDirectory, handoff.config.figma_project_id, 'tokens.json'))) {
                    throw new Error('Tokens not exported. Run `handoff-app fetch` first.');
                }
                // Build client preview styles
                return [4 /*yield*/, (0, preview_1.buildClientFiles)(handoff)
                        .then(function (value) { return !!value && console.log(chalk_1.default.green(value)); })
                        .catch(function (error) {
                        throw new Error(error);
                    })];
            case 1:
                // Build client preview styles
                _a.sent();
                return [4 /*yield*/, prepareProjectApp(handoff)];
            case 2:
                appPath = _a.sent();
                moduleOutput = path_1.default.resolve(appPath, 'out');
                if (fs_extra_1.default.existsSync(moduleOutput)) {
                    fs_extra_1.default.removeSync(moduleOutput);
                }
                return [4 /*yield*/, (0, next_dev_1.nextDev)({ port: 3000 }, 'cli', appPath)];
            case 3: 
            // Run
            return [2 /*return*/, _a.sent()];
        }
    });
}); };
exports.devApp = devApp;
exports.default = buildApp;
