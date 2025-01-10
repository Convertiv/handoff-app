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
exports.processComponent = exports.processSharedStyles = exports.renameComponent = exports.componentTransformer = exports.createFrameSocket = void 0;
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const sass_1 = __importDefault(require("sass"));
const preview_1 = require("../../utils/preview");
const chalk_1 = __importDefault(require("chalk"));
const node_html_parser_1 = require("node-html-parser");
const types_1 = require("./types");
const handlebars_1 = __importDefault(require("handlebars"));
const semver_1 = __importDefault(require("semver"));
const ws_1 = __importDefault(require("ws"));
const webSocketClientJS = `
<script>
const ws = new WebSocket('ws://localhost:3001');
  ws.onopen = function (event) {
    console.log('WebSocket connection opened');
    ws.send('Hello from client!');
  };

  ws.onmessage = function (event) {
    console.log('Message from server ', event.data);
    if(event.data === 'reload'){
      window.location.reload();
    }
  };
</script>
`;
var SlotType;
(function (SlotType) {
    SlotType["STRING"] = "string";
    SlotType["IMAGE"] = "image";
})(SlotType || (SlotType = {}));
/**
 * In dev mode we want to watch the components folder for changes
 * @param handoff
 * @returns
 * @returns
 */
const createFrameSocket = (handoff) => __awaiter(void 0, void 0, void 0, function* () {
    const wss = new ws_1.default.Server({ port: 3001 });
    function heartbeat() {
        this.isAlive = true;
    }
    wss.on('connection', function connection(ws) {
        const extWs = ws;
        extWs.send('Welcome to the WebSocket server!');
        extWs.isAlive = true;
        extWs.on('error', console.error);
        extWs.on('pong', heartbeat);
    });
    const interval = setInterval(function ping() {
        wss.clients.forEach(function each(ws) {
            const extWs = ws;
            if (extWs.isAlive === false)
                return ws.terminate();
            extWs.isAlive = false;
            ws.ping();
        });
    }, 30000);
    wss.on('close', function close() {
        clearInterval(interval);
    });
    console.log('WebSocket server started on ws://localhost:3001');
    return function (message) {
        wss.clients.forEach(function each(client) {
            if (client.readyState === ws_1.default.OPEN) {
                client.send(message);
            }
        });
    };
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
                    data = yield processComponent(handoff, file, sharedStyles);
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
                                    data = yield processComponent(handoff, versionFile, sharedStyles, path_1.default.join(file, versionDirectory));
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
 * A utility function to rename a component
 * @param handoff
 * @param source
 * @param destination
 */
function renameComponent(handoff, source, destination) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        source = path_1.default.resolve(handoff.workingPath, (_a = handoff.config.integrationPath) !== null && _a !== void 0 ? _a : 'integration', 'components', source);
        destination = path_1.default.resolve(handoff.workingPath, (_b = handoff.config.integrationPath) !== null && _b !== void 0 ? _b : 'integration', 'components', destination);
        ['hbs', 'js', 'scss', 'css'].forEach((ext) => __awaiter(this, void 0, void 0, function* () {
            console.log(`Checking for ${source}.${ext}`);
            let test = source.includes(`.${ext}`) ? source : `${source}.${ext}`;
            if (fs_extra_1.default.existsSync(test)) {
                yield fs_extra_1.default.rename(test, destination.includes(`.${ext}`) ? destination : `${destination}.${ext}`);
            }
        }));
    });
}
exports.renameComponent = renameComponent;
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
 * Process process a specific component
 * @param handoff
 * @param file
 * @param sharedStyles
 */
function processComponent(handoff, file, sharedStyles, sub) {
    var _a, _b, _c;
    return __awaiter(this, void 0, void 0, function* () {
        let data = {
            id: file.replace('.hbs', ''),
            title: 'Untitled',
            description: 'No description provided',
            preview: 'No preview available',
            type: types_1.ComponentType.Element,
            group: 'default',
            tags: [],
            previews: [
                {
                    title: 'Default',
                    values: {},
                    url: file,
                },
            ],
            properties: {},
            code: '',
            js: null,
            css: null,
            sass: null,
            sharedStyles: sharedStyles,
        };
        console.log(chalk_1.default.green(`Processing component ${file}`));
        if (!sub)
            sub = '';
        const custom = path_1.default.resolve(handoff.workingPath, `integration/components`, sub);
        const publicPath = path_1.default.resolve(handoff.workingPath, `public/api/component`);
        // Ensure the public API path exists
        if (!fs_extra_1.default.existsSync(publicPath)) {
            fs_extra_1.default.mkdirSync(publicPath, { recursive: true });
        }
        // Is there a JSON file with the same name?
        const jsonFile = file.replace('.hbs', '.json');
        const jsonPath = path_1.default.resolve(custom, jsonFile);
        let parsed = {};
        if (fs_extra_1.default.existsSync(jsonPath)) {
            const json = yield fs_extra_1.default.readFile(jsonPath, 'utf8');
            if (json) {
                try {
                    parsed = JSON.parse(json);
                    // The JSON file defines each of the fields
                    if (parsed) {
                        data.title = parsed.title;
                        data.type = parsed.type || types_1.ComponentType.Element;
                        data.group = parsed.group || 'default';
                        data.tags = parsed.tags || [];
                        data.description = parsed.description;
                        data.properties = parsed.properties;
                        data.previews = parsed.previews;
                    }
                }
                catch (e) {
                    console.log(chalk_1.default.red(`Error parsing JSON for ${file}`));
                    console.log(e);
                }
            }
        }
        // Is there a JS file with the same name?
        const jsFile = file.replace('.hbs', '.js');
        if (fs_extra_1.default.existsSync(path_1.default.resolve(custom, jsFile))) {
            console.log(chalk_1.default.green(`Detected JS file for ${file}`));
            try {
                const jsPath = path_1.default.resolve(custom, jsFile);
                const js = yield fs_extra_1.default.readFile(jsPath, 'utf8');
                const compiled = yield (0, preview_1.bundleJSWebpack)(jsPath, handoff, 'development');
                if (js) {
                    data.js = js;
                    data['jsCompiled'] = compiled;
                    yield fs_extra_1.default.writeFile(path_1.default.resolve(publicPath, jsFile), compiled);
                }
            }
            catch (e) {
                console.log(chalk_1.default.red(`Error compiling JS for ${file}`));
                console.log(e);
            }
        }
        // Is there a scss file with the same name?
        const scssFile = file.replace('.hbs', '.scss');
        const scssPath = path_1.default.resolve(custom, scssFile);
        const cssFile = file.replace('.hbs', '.css');
        const cssPath = path_1.default.resolve(custom, cssFile);
        if (fs_extra_1.default.existsSync(scssPath) && !fs_extra_1.default.existsSync(cssPath)) {
            console.log(chalk_1.default.green(`Detected SCSS file for ${file}`));
            try {
                const result = yield sass_1.default.compileAsync(scssPath, {
                    loadPaths: [
                        path_1.default.resolve(handoff.workingPath, (_a = handoff.config.integrationPath) !== null && _a !== void 0 ? _a : 'integration', 'sass'),
                        path_1.default.resolve(handoff.workingPath, 'node_modules'),
                        path_1.default.resolve(handoff.workingPath),
                        path_1.default.resolve(handoff.workingPath, 'exported', handoff.config.figma_project_id),
                    ],
                });
                if (result.css) {
                    // @ts-ignore
                    data['css'] = result.css;
                    // Split the CSS into shared styles and component styles
                    const splitCSS = (_b = data['css']) === null || _b === void 0 ? void 0 : _b.split('/* COMPONENT STYLES*/');
                    // If there are two parts, the first part is the shared styles
                    if (splitCSS && splitCSS.length > 1) {
                        data['css'] = splitCSS[1];
                        data['sharedStyles'] = splitCSS[0];
                        yield fs_extra_1.default.writeFile(path_1.default.resolve(publicPath, `shared.css`), data['sharedStyles']);
                    }
                    else {
                        if (!sharedStyles)
                            sharedStyles = '/* These are the shared styles used in every component. */ \n\n';
                        yield fs_extra_1.default.writeFile(path_1.default.resolve(publicPath, `shared.css`), sharedStyles);
                    }
                    yield fs_extra_1.default.writeFile(path_1.default.resolve(publicPath, cssFile), data['css']);
                }
            }
            catch (e) {
                console.log(chalk_1.default.red(`Error compiling SCSS for ${file}`));
                throw e;
            }
            const scss = yield fs_extra_1.default.readFile(scssPath, 'utf8');
            if (scss) {
                data['sass'] = scss;
            }
        }
        // Is there a css file with the same name?
        if (fs_extra_1.default.existsSync(cssPath)) {
            const css = yield fs_extra_1.default.readFile(path_1.default.resolve(custom, cssFile), 'utf8');
            if (css) {
                data['css'] = css;
            }
        }
        const template = yield fs_extra_1.default.readFile(path_1.default.resolve(custom, file), 'utf8');
        try {
            const previews = {};
            for (const previewKey in data.previews) {
                const url = file.replace('.hbs', `-${previewKey}.html`);
                data.previews[previewKey].url = url;
                const publicFile = path_1.default.resolve(publicPath, url);
                const jsCompiled = data['jsCompiled'] ? `<script src="/api/component/${jsFile}"></script>` : '';
                let style = data['css'] ? `<link rel="stylesheet" href="/api/component/${cssFile}">` : '';
                if (data['sharedStyles']) {
                    style = `<link rel="stylesheet" href="/api/component/shared.css">` + style;
                }
                previews[previewKey] = handlebars_1.default.compile(template)({
                    config: handoff.config,
                    style: style,
                    script: jsCompiled + '\n' + webSocketClientJS,
                    sharedStyles: data['css'] ? `<link rel="stylesheet" href="/api/component/shared.css">` : '',
                    properties: ((_c = data.previews[previewKey]) === null || _c === void 0 ? void 0 : _c.values) || {},
                });
                yield fs_extra_1.default.writeFile(publicFile, previews[previewKey]);
            }
            data.preview = '';
            const bodyEl = (0, node_html_parser_1.parse)(template).querySelector('body');
            const code = bodyEl ? bodyEl.innerHTML.trim() : template;
            data['code'] = code;
            data['sharedStyles'] = sharedStyles;
            // discard shared styles from the css output
        }
        catch (e) {
            console.log(e);
            // write the preview to the public folder
            throw new Error('stop');
        }
        return data;
    });
}
exports.processComponent = processComponent;
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
