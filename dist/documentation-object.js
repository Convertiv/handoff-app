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
exports.createDocumentationObject = void 0;
var assets_1 = __importDefault(require("./exporters/assets"));
var index_1 = require("./exporters/components/index");
var design_1 = require("./exporters/design");
var startCase_1 = __importDefault(require("lodash/startCase"));
var chalk_1 = __importDefault(require("chalk"));
var createDocumentationObject = function (handoff, legacyDefinitions) { return __awaiter(void 0, void 0, void 0, function () {
    var design, icons, logos, components;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, design_1.getFigmaFileDesignTokens)(handoff.config.figma_project_id, handoff.config.dev_access_token)];
            case 1:
                design = _a.sent();
                return [4 /*yield*/, (0, assets_1.default)(handoff.config.figma_project_id, handoff.config.dev_access_token, 'Icons')];
            case 2:
                icons = _a.sent();
                return [4 /*yield*/, (0, assets_1.default)(handoff.config.figma_project_id, handoff.config.dev_access_token, 'Logo')];
            case 3:
                logos = _a.sent();
                /// create a design map of node ids and references
                handoff.designMap = {
                    colors: design.color.reduce(function (acc, color) {
                        acc[color.id] = {
                            reference: color.reference,
                            type: 'color',
                            group: color.group,
                            name: color.name,
                        };
                        return acc;
                    }, {}),
                    effects: design.effect.reduce(function (acc, effect) {
                        acc[effect.id] = {
                            reference: effect.reference,
                            group: effect.group,
                            name: effect.name,
                            type: 'effect',
                        };
                        return acc;
                    }, {}),
                    typography: design.typography.reduce(function (acc, typo) {
                        acc[typo.id] = {
                            reference: typo.reference,
                            type: 'typography',
                            group: typo.group,
                            name: typo.name,
                        };
                        return acc;
                    }, {}),
                };
                return [4 /*yield*/, (0, index_1.getFigmaFileComponents)(handoff, legacyDefinitions)];
            case 4:
                components = _a.sent();
                // Log out components
                Object.keys(components).map(function (component) {
                    if (components[component].instances.length === 0) {
                        console.error(chalk_1.default.grey("Skipping \"".concat((0, startCase_1.default)(component), "\". Reason: No matching component instances were found.")));
                    }
                    else {
                        console.log(chalk_1.default.green("".concat((0, startCase_1.default)(component), " exported:")), components[component].instances.length);
                    }
                });
                return [2 /*return*/, {
                        timestamp: new Date().toISOString(),
                        design: design,
                        components: components,
                        assets: {
                            icons: icons,
                            logos: logos,
                        },
                    }];
        }
    });
}); };
exports.createDocumentationObject = createDocumentationObject;
