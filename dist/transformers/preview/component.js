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
exports.processSharedStyles = exports.componentTransformer = exports.createFrameSocket = exports.SlotType = void 0;
const chalk_1 = __importDefault(require("chalk"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const sass_1 = __importDefault(require("sass"));
const semver_1 = __importDefault(require("semver"));
const builder_1 = __importDefault(require("./component/builder"));
var SlotType;
(function (SlotType) {
    SlotType["TEXT"] = "text";
    SlotType["IMAGE"] = "image";
    SlotType["BUTTON"] = "button";
    SlotType["ARRAY"] = "array";
    SlotType["NUMBER"] = "number";
    SlotType["BOOLEAN"] = "boolean";
    SlotType["OBJECT"] = "object";
})(SlotType = exports.SlotType || (exports.SlotType = {}));
/**
 * In dev mode we want to watch the components folder for changes
 * @param handoff
 * @returns
 * @returns
 */
const createFrameSocket = (handoff) => __awaiter(void 0, void 0, void 0, function* () {
    // const wss = new WebSocket.Server({ port: 3001 });
    // function heartbeat() {
    //   this.isAlive = true;
    // }
    // wss.on('connection', function connection(ws) {
    //   const extWs = ws as ExtWebSocket;
    //   extWs.send('Welcome to the WebSocket server!');
    //   extWs.isAlive = true;
    //   extWs.on('error', console.error);
    //   extWs.on('pong', heartbeat);
    // });
    // const interval = setInterval(function ping() {
    //   wss.clients.forEach(function each(ws) {
    //     const extWs = ws as ExtWebSocket;
    //     if (extWs.isAlive === false) return ws.terminate();
    //     extWs.isAlive = false;
    //     ws.ping();
    //   });
    // }, 30000);
    // wss.on('close', function close() {
    //   clearInterval(interval);
    // });
    // console.log('WebSocket server started on ws://localhost:3001');
    // return function (message: string) {
    //   wss.clients.forEach(function each(client) {
    //     if (client.readyState === WebSocket.OPEN) {
    //       client.send(message);
    //     }
    //   });
    // };
});
exports.createFrameSocket = createFrameSocket;
//
/**
 * Create a component transformer
 * @param handoff
 * @param documentationObject
 * @returns
 */
function componentTransformer(handoff) {
    return __awaiter(this, void 0, void 0, function* () {
        // Allow a user to create custom previews by putting templates in a components folder
        // Iterate over the html files in that folder and render them as a preview
        const custom = path_1.default.resolve(handoff.workingPath, `integration/components`);
        const publicPath = path_1.default.resolve(handoff.workingPath, `public/components`);
        const publicAPIPath = path_1.default.resolve(handoff.workingPath, `public/api/component`);
        // ensure public path exists
        if (!fs_extra_1.default.existsSync(publicPath)) {
            fs_extra_1.default.mkdirSync(publicPath, { recursive: true });
        }
        if (fs_extra_1.default.existsSync(custom)) {
            console.log(chalk_1.default.green(`Rendering Component Previews in ${custom}`));
            const sharedStyles = yield processSharedStyles(handoff);
            const files = fs_extra_1.default.readdirSync(custom);
            const componentData = {};
            for (const file of files) {
                let versions = {};
                let data = undefined;
                if (file.endsWith('.hbs')) {
                    data = yield (0, builder_1.default)(handoff, file, sharedStyles);
                    // Write the API file
                    // we're in the root directory so this must be version 0.
                    versions['0.0.0'] = data;
                }
                else if (fs_extra_1.default.lstatSync(path_1.default.resolve(custom, file)).isDirectory()) {
                    // this is a directory structure.  this should be the component name,
                    // and each directory inside should be a version
                    const versionDirectories = fs_extra_1.default.readdirSync(path_1.default.resolve(custom, file));
                    // The directory name must be a semver
                    for (const versionDirectory of versionDirectories) {
                        if (semver_1.default.valid(versionDirectory)) {
                            const versionFiles = fs_extra_1.default.readdirSync(path_1.default.resolve(custom, file, versionDirectory));
                            for (const versionFile of versionFiles) {
                                console.log(`Processing version ${versionDirectory} for ${file}`);
                                if (versionFile.endsWith('.hbs')) {
                                    data = yield (0, builder_1.default)(handoff, versionFile, sharedStyles, versionDirectory);
                                    versions[versionDirectory] = data;
                                }
                            }
                        }
                        else {
                            console.error(`Invalid version directory ${versionDirectory}`);
                        }
                    }
                }
                if (data) {
                    let name = file.replace('.hbs', '');
                    if (componentData[name]) {
                        // merge the versions
                        componentData[name] = Object.assign(Object.assign({}, componentData[name]), versions);
                    }
                    else {
                        componentData[name] = versions;
                    }
                    // find the latest version
                    let versionSet = Object.keys(componentData[name])
                        .filter((key) => semver_1.default.valid(key))
                        .sort(semver_1.default.rcompare);
                    if (versionSet.length > 0) {
                        let latest = versionSet[0];
                        componentData[name]['latest'] = componentData[name][latest];
                        componentData[name]['version'] = latest;
                    }
                }
            }
            buildPreviewAPI(handoff, componentData);
        }
        return;
    });
}
exports.componentTransformer = componentTransformer;
/**
 * Process the shared styles with sass compileAsync
 * @param handoff
 * @returns
 */
function processSharedStyles(handoff) {
    return __awaiter(this, void 0, void 0, function* () {
        const custom = path_1.default.resolve(handoff.workingPath, `integration/components`);
        const publicPath = path_1.default.resolve(handoff.workingPath, `public/api/component`);
        // Is there a scss file with the same name?
        const scssPath = path_1.default.resolve(custom, 'shared.scss');
        const cssPath = path_1.default.resolve(custom, 'shared.css');
        if (fs_extra_1.default.existsSync(scssPath) && !fs_extra_1.default.existsSync(cssPath)) {
            console.log(chalk_1.default.green(`Compiling shared styles`));
            try {
                const result = yield sass_1.default.compileAsync(scssPath, {
                    loadPaths: [
                        path_1.default.resolve(handoff.workingPath, 'integration/sass'),
                        path_1.default.resolve(handoff.workingPath, 'node_modules'),
                        path_1.default.resolve(handoff.workingPath),
                        path_1.default.resolve(handoff.workingPath, 'exported', handoff.config.figma_project_id),
                    ],
                });
                if (result.css) {
                    // write the css to the public folder
                    const css = '/* These are the shared styles used in every component. */ \n\n' + result.css;
                    const cssPath = path_1.default.resolve(publicPath, 'shared.css');
                    console.log(chalk_1.default.green(`Writing shared styles to ${cssPath}`));
                    yield fs_extra_1.default.writeFile(cssPath, result.css);
                    return css;
                }
            }
            catch (e) {
                console.log(chalk_1.default.red(`Error compiling shared styles`));
                console.log(e);
            }
        }
        else if (fs_extra_1.default.existsSync(cssPath)) {
            const css = yield fs_extra_1.default.readFile(cssPath, 'utf8');
            return css;
        }
    });
}
exports.processSharedStyles = processSharedStyles;
/**
 * Build the preview API from the component data
 * @param handoff
 * @param componentData
 */
const buildPreviewAPI = (handoff, componentData) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const publicPath = path_1.default.resolve(handoff.workingPath, `public/api`);
    const files = fs_extra_1.default.readdirSync(publicPath);
    const output = [];
    const content = {};
    for (const component in componentData) {
        // find the latest
        let latest = componentData[component]['latest'];
        if (latest) {
            // read the file
            output.push({
                id: component,
                version: componentData[component]['version'],
                title: latest.title,
                type: latest.type,
                group: latest.group,
                tags: latest.tags,
                description: latest.description,
                properties: latest.properties,
            });
            // iterate over the properties and add them to the content
            for (const property in latest.properties) {
                if (!content[property]) {
                    content[property] = {
                        id: property,
                        name: latest.properties[property].name,
                        description: latest.properties[property].description,
                        type: latest.properties[property].type,
                        components: [],
                    };
                }
                else {
                    // merge the rules
                    // content[property].rules = [...new Set([...content[property].rules, ...latest.properties[property].rules])];
                }
                let previews = {};
                for (const preview in latest.previews) {
                    previews[preview] = (_a = latest.previews[preview].values[property]) !== null && _a !== void 0 ? _a : '';
                }
                content[property].components.push({ component, previews });
            }
        }
        else {
            console.log(`No latest version found for ${component}`);
        }
        yield fs_extra_1.default.writeFile(path_1.default.resolve(publicPath, 'component', `${component}.json`), JSON.stringify(componentData[component], null, 2));
    }
    // write the content file
    yield fs_extra_1.default.writeFile(path_1.default.resolve(publicPath, 'content.json'), JSON.stringify(content, null, 2));
    yield fs_extra_1.default.writeFile(path_1.default.resolve(publicPath, 'components.json'), JSON.stringify(output, null, 2));
});
