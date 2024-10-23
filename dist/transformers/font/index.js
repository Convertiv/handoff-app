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
exports.zipFonts = void 0;
var chalk_1 = __importDefault(require("chalk"));
var archiver_1 = __importDefault(require("archiver"));
var fs_extra_1 = __importDefault(require("fs-extra"));
var path_1 = __importDefault(require("path"));
var sortedUniq_1 = __importDefault(require("lodash/sortedUniq"));
/**
 * Detect a font present in the public dir.  If it matches a font family from
 * figma, zip it up and make it avaliable in the config for use
 */
function fontTransformer(handoff, documentationObject) {
    return __awaiter(this, void 0, void 0, function () {
        var design, outputFolder, fontLocation, families, customFonts;
        var _this = this;
        return __generator(this, function (_a) {
            design = documentationObject.design;
            outputFolder = 'public';
            fontLocation = path_1.default.join(handoff === null || handoff === void 0 ? void 0 : handoff.workingPath, 'fonts');
            families = design.typography.reduce(function (result, current) {
                var _a;
                return __assign(__assign({}, result), (_a = {}, _a[current.values.fontFamily] = result[current.values.fontFamily]
                    ? // sorts and returns unique font weights
                        (0, sortedUniq_1.default)(__spreadArray(__spreadArray([], result[current.values.fontFamily], true), [current.values.fontWeight], false).sort(function (a, b) { return a - b; }))
                    : [current.values.fontWeight], _a));
            }, {});
            customFonts = [];
            Object.keys(families).map(function (key) { return __awaiter(_this, void 0, void 0, function () {
                var name, fontDirName, stream_1, fontsFolder;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            name = key.replace(/\s/g, '');
                            fontDirName = path_1.default.join(fontLocation, name);
                            if (!fs_extra_1.default.existsSync(fontDirName)) return [3 /*break*/, 3];
                            console.log(chalk_1.default.green("Found a custom font ".concat(name)));
                            stream_1 = fs_extra_1.default.createWriteStream(path_1.default.join(fontLocation, "".concat(name, ".zip")));
                            return [4 /*yield*/, (0, exports.zipFonts)(fontDirName, stream_1)];
                        case 1:
                            _b.sent();
                            fontsFolder = path_1.default.resolve(handoff.workingPath, handoff.exportsDirectory, handoff.config.figma_project_id, (_a = handoff.config.integrationPath) !== null && _a !== void 0 ? _a : 'integration', 'fonts');
                            if (!fs_extra_1.default.existsSync(fontsFolder)) {
                                fs_extra_1.default.mkdirSync(fontsFolder);
                            }
                            return [4 /*yield*/, fs_extra_1.default.copySync(fontDirName, fontsFolder)];
                        case 2:
                            _b.sent();
                            customFonts.push("".concat(name, ".zip"));
                            _b.label = 3;
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            return [2 /*return*/];
        });
    });
}
exports.default = fontTransformer;
/**
 * Zip the fonts for download
 * @param dirPath
 * @param destination
 * @returns
 */
var zipFonts = function (dirPath, destination) { return __awaiter(void 0, void 0, void 0, function () {
    var archive, fontDir, _i, fontDir_1, file, data;
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
                return [4 /*yield*/, fs_extra_1.default.readdir(dirPath)];
            case 1:
                fontDir = _a.sent();
                for (_i = 0, fontDir_1 = fontDir; _i < fontDir_1.length; _i++) {
                    file = fontDir_1[_i];
                    data = fs_extra_1.default.readFileSync(path_1.default.join(dirPath, file), 'utf-8');
                    archive.append(data, { name: path_1.default.basename(file) });
                }
                return [4 /*yield*/, archive.finalize()];
            case 2:
                _a.sent();
                return [2 /*return*/, destination];
        }
    });
}); };
exports.zipFonts = zipFonts;
