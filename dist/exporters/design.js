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
import chalk from 'chalk';
import { getFileNodes, getFileStyles } from '../figma/api.js';
import { transformFigmaColorToHex, transformFigmaEffectToCssBoxShadow, transformFigmaFillsToCssColor } from '../utils/convertColor.js';
import { isShadowEffectType, isValidEffectType, isValidGradientType } from './utils.js';
var toMachineName = function (name) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9\s\-]/gi, '')
        .replace(/\s\-\s|\s+/gi, '-');
};
var fieldData = function (name) {
    var nameArray = name.split('/');
    var data = {
        name: '',
        machine_name: '',
        group: '',
    };
    if (nameArray[1]) {
        data.group = toMachineName(nameArray[0]);
        data.name = nameArray[1];
        data.machine_name = toMachineName(data.name);
    }
    else {
        data.name = nameArray[0];
        data.machine_name = toMachineName(data.name);
    }
    return data;
};
var isArray = function (input) {
    return Array.isArray(input);
};
export var getFigmaFileDesignTokens = function (fileId, accessToken) { return __awaiter(void 0, void 0, void 0, function () {
    var apiResponse, file, styles, nodeMeta, nodeIds, childrenApiResponse, tokens, colorsArray_1, effectsArray_1, typographyArray_1, data, err_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, getFileStyles(fileId, accessToken)];
            case 1:
                apiResponse = _a.sent();
                file = apiResponse.data;
                styles = file.meta.styles;
                nodeMeta = styles.map(function (item) { return ({
                    node_id: item.node_id,
                    sort_position: item.sort_position,
                }); });
                nodeIds = nodeMeta
                    .sort(function (a, b) {
                    if (a.sort_position < b.sort_position) {
                        return -1;
                    }
                    if (a.sort_position > b.sort_position) {
                        return 1;
                    }
                    return 0;
                })
                    .map(function (item) { return item.node_id; });
                return [4 /*yield*/, getFileNodes(fileId, nodeIds, accessToken)];
            case 2:
                childrenApiResponse = _a.sent();
                tokens = Object.entries(childrenApiResponse.data.nodes);
                colorsArray_1 = [];
                effectsArray_1 = [];
                typographyArray_1 = [];
                tokens.forEach(function (_a) {
                    var _ = _a[0], node = _a[1];
                    if (!node) {
                        return;
                    }
                    var document = node.document;
                    if (document.type === 'RECTANGLE') {
                        var _b = fieldData(document.name), name_1 = _b.name, machine_name = _b.machine_name, group = _b.group;
                        if (isArray(document.effects) && document.effects.length > 0) {
                            effectsArray_1.push({
                                name: name_1,
                                machineName: machine_name,
                                group: group,
                                effects: document.effects
                                    .filter(function (effect) { return isValidEffectType(effect.type) && effect.visible; })
                                    .map(function (effect) { return ({
                                    type: effect.type,
                                    value: isShadowEffectType(effect.type)
                                        ? transformFigmaEffectToCssBoxShadow(effect)
                                        : '',
                                }); })
                            });
                        }
                        else if (isArray(document.fills) && document.fills[0] && (document.fills[0].type === 'SOLID' || isValidGradientType(document.fills[0].type))) {
                            var color = transformFigmaFillsToCssColor(document.fills);
                            colorsArray_1.push({
                                name: name_1,
                                group: group,
                                value: color.color,
                                blend: color.blend,
                                sass: "$color-".concat(group, "-").concat(machine_name),
                                machineName: machine_name,
                            });
                        }
                    }
                    if (document.type === 'TEXT') {
                        var _c = fieldData(document.name), machine_name = _c.machine_name, group = _c.group;
                        var color = void 0;
                        if (isArray(document.fills) && document.fills[0] && document.fills[0].type === 'SOLID' && document.fills[0].color) {
                            color = transformFigmaColorToHex(document.fills[0].color);
                        }
                        typographyArray_1.push({
                            name: document.name,
                            machine_name: machine_name,
                            group: group,
                            values: __assign(__assign({}, document.style), { color: color }),
                        });
                    }
                });
                chalk.green('Colors, Effects and Typography Exported');
                data = {
                    color: colorsArray_1,
                    effect: effectsArray_1,
                    typography: typographyArray_1,
                };
                return [2 /*return*/, data];
            case 3:
                err_1 = _a.sent();
                throw new Error('An error occured fetching Colors and Typography.  This typically happens when the library cannot be read from Handoff');
            case 4: return [2 /*return*/];
        }
    });
}); };
