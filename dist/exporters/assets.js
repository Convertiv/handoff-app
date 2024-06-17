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
exports.zipAssets = void 0;
var axios_1 = __importDefault(require("axios"));
var archiver_1 = __importDefault(require("archiver"));
var api_1 = require("../figma/api");
var Utils = __importStar(require("../utils/index"));
var chalk_1 = __importDefault(require("chalk"));
var defaultExtension = 'svg';
var assetsExporter = function (fileId, accessToken, component) { return __awaiter(void 0, void 0, void 0, function () {
    var parent_response_1, asset_components, numOfAssets, assetsUrlsRes, assetsList, err_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                return [4 /*yield*/, (0, api_1.getFileComponent)(fileId, accessToken)];
            case 1:
                parent_response_1 = _a.sent();
                asset_components = Object.entries(parent_response_1.data.meta.components)
                    .filter(function (_a) {
                    var _b;
                    var _ = _a[0], value = _a[1];
                    return ((_b = value.containing_frame.name) === null || _b === void 0 ? void 0 : _b.indexOf(component)) > -1;
                })
                    .map(function (_a) {
                    var key = _a[0], value = _a[1];
                    return {
                        id: key,
                        description: value.description,
                        key: value.key,
                        name: value.name,
                    };
                });
                numOfAssets = asset_components.length;
                console.log(chalk_1.default.green("".concat(component, " exported:")), numOfAssets);
                if (!numOfAssets) {
                    return [2 /*return*/, []];
                }
                return [4 /*yield*/, (0, api_1.getAssetURL)(fileId, Object.entries(parent_response_1.data.meta.components)
                        .filter(function (_a) {
                        var _b;
                        var _ = _a[0], value = _a[1];
                        return ((_b = value.containing_frame.name) === null || _b === void 0 ? void 0 : _b.indexOf(component)) > -1;
                    })
                        .sort(function (_a, _b) {
                        var a_key = _a[0], a_val = _a[1];
                        var b_key = _b[0], b_val = _b[1];
                        // Fetch node ids
                        a_key;
                        b_key;
                        var a_parts = a_val.node_id.split(':');
                        var b_parts = b_val.node_id.split(':');
                        var a_sort = 0, b_sort = 0;
                        if (a_parts[1]) {
                            a_sort = parseInt(a_parts[0]) + parseInt(a_parts[1]);
                        }
                        if (b_parts[1]) {
                            b_sort = parseInt(b_parts[0]) + parseInt(b_parts[1]);
                        }
                        return a_sort - b_sort;
                    })
                        .map(function (_a) {
                        var key = _a[0], _ = _a[1];
                        key;
                        return _.node_id;
                    }), defaultExtension, accessToken)];
            case 2:
                assetsUrlsRes = _a.sent();
                return [4 /*yield*/, Promise.all(Object.entries(assetsUrlsRes.data.images).map(function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
                        var componentData, svgData, assetName, filename;
                        var _c;
                        var assetId = _b[0], assetUrl = _b[1];
                        return __generator(this, function (_d) {
                            switch (_d.label) {
                                case 0:
                                    componentData = parent_response_1.data.meta.components.filter(function (value) { return value.node_id === assetId; }).shift();
                                    if (!componentData) return [3 /*break*/, 2];
                                    return [4 /*yield*/, axios_1.default.get(assetUrl)];
                                case 1:
                                    svgData = _d.sent();
                                    assetName = Utils.slugify((_c = componentData.name) !== null && _c !== void 0 ? _c : '');
                                    filename = assetName + '.' + defaultExtension;
                                    return [2 /*return*/, {
                                            path: filename,
                                            name: assetName,
                                            icon: assetName,
                                            description: componentData.description,
                                            index: assetName.toLowerCase().replace(/[\W_]+/g, ' '),
                                            size: svgData.data.length,
                                            data: svgData.data.replace(/(\r\n|\n|\r)/gm, ''),
                                        }];
                                case 2: return [2 /*return*/, null];
                            }
                        });
                    }); }))];
            case 3:
                assetsList = _a.sent();
                return [2 /*return*/, assetsList.filter(Utils.filterOutNull)];
            case 4:
                err_1 = _a.sent();
                console.error(err_1);
                return [2 /*return*/, []];
            case 5: return [2 /*return*/];
        }
    });
}); };
var zipAssets = function (assets, destination) { return __awaiter(void 0, void 0, void 0, function () {
    var archive;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                archive = (0, archiver_1.default)('zip', {
                    zlib: { level: 9 }, // Sets the compression level.
                });
                // good practice to catch this error explicitly
                archive.on('error', function (err) {
                    throw err;
                });
                archive.pipe(destination);
                assets.forEach(function (asset) {
                    archive.append(asset.data, { name: asset.path });
                });
                return [4 /*yield*/, archive.finalize()];
            case 1:
                _a.sent();
                return [2 /*return*/, destination];
        }
    });
}); };
exports.zipAssets = zipAssets;
exports.default = assetsExporter;
