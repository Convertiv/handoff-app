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
exports.processSharedStyles = exports.componentTransformer = exports.getComponentOutputPath = exports.getComponentPath = exports.createFrameSocket = exports.SlotType = void 0;
const chalk_1 = __importDefault(require("chalk"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const sass_1 = __importDefault(require("sass"));
const api_1 = __importStar(require("./component/api"));
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
const getComponentPath = (handoff) => path_1.default.resolve(handoff.workingPath, `integration/components`);
exports.getComponentPath = getComponentPath;
const getComponentOutputPath = (handoff) => path_1.default.resolve((0, api_1.getAPIPath)(handoff), 'component');
exports.getComponentOutputPath = getComponentOutputPath;
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
        const componentPath = (0, exports.getComponentPath)(handoff);
        if (fs_extra_1.default.existsSync(componentPath)) {
            console.log(chalk_1.default.green(`Rendering Component Previews in ${componentPath}`));
            const sharedStyles = yield processSharedStyles(handoff);
            const files = fs_extra_1.default.readdirSync(componentPath);
            const componentData = [];
            for (const file of files) {
                componentData.push(yield (0, builder_1.default)(handoff, path_1.default.basename(file), sharedStyles));
            }
            (0, api_1.default)(handoff, componentData);
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
