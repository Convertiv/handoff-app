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
exports.getComponentTemplate = void 0;
var path_1 = __importDefault(require("path"));
var fs_extra_1 = __importDefault(require("fs-extra"));
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);
/**
 * Get the component template
 * @param component
 * @param parts
 * @returns
 */
var getComponentTemplate = function (component) {
    var parts = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        parts[_i - 1] = arguments[_i];
    }
    return __awaiter(void 0, void 0, void 0, function () {
        var componentFallbackPath, componentFallbackOverridePath, partsTemplatePath, partsTemplateOverridePath;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    componentFallbackPath = path_1.default.resolve(__dirname, "../../templates/".concat(component, "/default.html"));
                    componentFallbackOverridePath = path_1.default.resolve(process.cwd(), "integration/templates/".concat(component, "/default.html"));
                    if (!!parts.length) return [3 /*break*/, 7];
                    return [4 /*yield*/, fs_extra_1.default.pathExists(componentFallbackOverridePath)];
                case 1:
                    if (!_a.sent()) return [3 /*break*/, 3];
                    return [4 /*yield*/, fs_extra_1.default.readFile(componentFallbackOverridePath, 'utf8')];
                case 2: return [2 /*return*/, _a.sent()];
                case 3: return [4 /*yield*/, fs_extra_1.default.pathExists(componentFallbackPath)];
                case 4:
                    if (!_a.sent()) return [3 /*break*/, 6];
                    return [4 /*yield*/, fs_extra_1.default.readFile(componentFallbackPath, 'utf8')];
                case 5: return [2 /*return*/, _a.sent()];
                case 6: return [2 /*return*/, null];
                case 7:
                    partsTemplatePath = path_1.default.resolve(__dirname, "../../templates/".concat(component, "/").concat(parts.join('/'), ".html"));
                    partsTemplateOverridePath = path_1.default.resolve(process.cwd(), "integration/templates/".concat(component, "/").concat(parts.join('/'), ".html"));
                    return [4 /*yield*/, fs_extra_1.default.pathExists(partsTemplateOverridePath)];
                case 8:
                    if (!_a.sent()) return [3 /*break*/, 10];
                    return [4 /*yield*/, fs_extra_1.default.readFile(partsTemplateOverridePath, 'utf8')];
                case 9: return [2 /*return*/, _a.sent()];
                case 10: return [4 /*yield*/, fs_extra_1.default.pathExists(partsTemplatePath)];
                case 11:
                    if (!_a.sent()) return [3 /*break*/, 13];
                    return [4 /*yield*/, fs_extra_1.default.readFile(partsTemplatePath, 'utf8')];
                case 12: return [2 /*return*/, _a.sent()];
                case 13: return [4 /*yield*/, exports.getComponentTemplate.apply(void 0, __spreadArray([component], parts.slice(0, -1), false))];
                case 14: return [2 /*return*/, _a.sent()];
            }
        });
    });
};
exports.getComponentTemplate = getComponentTemplate;