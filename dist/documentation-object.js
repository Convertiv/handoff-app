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
exports.createDocumentationObject = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const api_1 = require("./transformers/preview/component/api");
const createDocumentationObject = (handoff) => __awaiter(void 0, void 0, void 0, function* () {
    const runner = yield handoff.getRunner();
    const localStyles = yield runner.extractLocalStyles();
    const icons = yield runner.extractAssets('Icons');
    yield writeAssets(handoff, icons, 'icons');
    const logos = yield runner.extractAssets('Logo');
    yield writeAssets(handoff, logos, 'logos');
    const components = yield runner.extractComponents(localStyles);
    return {
        timestamp: new Date().toISOString(),
        localStyles,
        components,
        assets: {
            icons,
            logos,
        },
    };
});
exports.createDocumentationObject = createDocumentationObject;
const writeAssets = (handoff, assets, type) => __awaiter(void 0, void 0, void 0, function* () {
    const assetPath = path_1.default.join((0, api_1.getAPIPath)(handoff), 'assets');
    if (!fs_1.default.existsSync(assetPath))
        fs_1.default.mkdirSync(assetPath, { recursive: true });
    // write json file
    fs_1.default.writeFileSync(path_1.default.join(assetPath, `${type}.json`), JSON.stringify(assets, null, 2));
    const assetFolder = path_1.default.join(assetPath, type);
    if (!fs_1.default.existsSync(assetFolder))
        fs_1.default.mkdirSync(assetFolder, { recursive: true });
    assets.forEach((asset) => {
        fs_1.default.writeFileSync(path_1.default.join(assetFolder, asset.path), asset.data);
    });
});
