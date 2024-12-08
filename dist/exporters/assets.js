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
exports.zipAssets = void 0;
const axios_1 = __importDefault(require("axios"));
const archiver_1 = __importDefault(require("archiver"));
const api_1 = require("../figma/api");
const Utils = __importStar(require("../utils/index"));
const chalk_1 = __importDefault(require("chalk"));
const defaultExtension = 'svg';
const assetsExporter = (fileId, accessToken, component) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const parent_response = yield (0, api_1.getFileComponent)(fileId, accessToken);
        const asset_components = Object.entries(parent_response.data.meta.components)
            .filter(([_, value]) => { var _a; return ((_a = value.containing_frame.name) === null || _a === void 0 ? void 0 : _a.indexOf(component)) > -1; })
            .map(([key, value]) => {
            return {
                id: key,
                description: value.description,
                key: value.key,
                name: value.name,
            };
        });
        const numOfAssets = asset_components.length;
        console.log(chalk_1.default.green(`${component} exported:`), numOfAssets);
        if (!numOfAssets) {
            return [];
        }
        const assetsUrlsRes = yield (0, api_1.getAssetURL)(fileId, Object.entries(parent_response.data.meta.components)
            .filter(([_, value]) => { var _a; return ((_a = value.containing_frame.name) === null || _a === void 0 ? void 0 : _a.indexOf(component)) > -1; })
            .sort(([a_key, a_val], [b_key, b_val]) => {
            // Fetch node ids
            a_key;
            b_key;
            const a_parts = a_val.node_id.split(':');
            const b_parts = b_val.node_id.split(':');
            let a_sort = 0, b_sort = 0;
            if (a_parts[1]) {
                a_sort = parseInt(a_parts[0]) + parseInt(a_parts[1]);
            }
            if (b_parts[1]) {
                b_sort = parseInt(b_parts[0]) + parseInt(b_parts[1]);
            }
            return a_sort - b_sort;
        })
            .map(([key, _]) => {
            key;
            return _.node_id;
        }), defaultExtension, accessToken);
        const assetsList = yield Promise.all(Object.entries(assetsUrlsRes.data.images).map(([assetId, assetUrl]) => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            const componentData = parent_response.data.meta.components.filter((value) => value.node_id === assetId).shift();
            if (componentData) {
                const svgData = yield axios_1.default.get(assetUrl);
                const assetName = Utils.slugify((_a = componentData.name) !== null && _a !== void 0 ? _a : '');
                const filename = assetName + '.' + defaultExtension;
                return {
                    path: filename,
                    name: assetName,
                    icon: assetName,
                    description: componentData.description,
                    index: assetName.toLowerCase().replace(/[\W_]+/g, ' '),
                    size: svgData.data.length,
                    data: svgData.data.replace(/(\r\n|\n|\r)/gm, ''),
                };
            }
            else {
                return null;
            }
        })));
        return assetsList.filter(Utils.filterOutNull);
    }
    catch (err) {
        console.error(err);
        return [];
    }
});
const zipAssets = (assets, destination) => __awaiter(void 0, void 0, void 0, function* () {
    const archive = (0, archiver_1.default)('zip', {
        zlib: { level: 9 }, // Sets the compression level.
    });
    // good practice to catch this error explicitly
    archive.on('error', function (err) {
        throw err;
    });
    archive.pipe(destination);
    assets.forEach((asset) => {
        archive.append(asset.data, { name: asset.path });
    });
    yield archive.finalize();
    return destination;
});
exports.zipAssets = zipAssets;
exports.default = assetsExporter;
