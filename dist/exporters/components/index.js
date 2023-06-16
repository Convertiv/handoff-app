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
import chalk from 'chalk';
import { getComponentSetNodes, getComponentSets } from '../../figma/api';
import { filterByNodeType } from '../utils';
import extractComponents from './extractor';
var getComponentSetComponents = function (metadata, componentSets, componentMetadata, name) {
    var componentSet = componentSets.find(function (componentSet) { return componentSet.name === name; });
    if (!componentSet) {
        // TODO: remove this when all component sets are implemented
        return { components: [], metadata: {} };
        throw new Error("No component set found for ".concat(name));
    }
    var componentSetMetadata = metadata.find(function (metadata) { return metadata.node_id === componentSet.id; });
    var baseComponentSetMetadata = componentSetMetadata
        ? metadata.find(function (metadata) {
            return metadata.node_id !== componentSetMetadata.node_id &&
                metadata.containing_frame.nodeId === componentSetMetadata.containing_frame.nodeId;
        })
        : undefined;
    var baseComponentSet = baseComponentSetMetadata
        ? componentSets.find(function (componentSet) { return componentSet.id === baseComponentSetMetadata.node_id; })
        : undefined;
    var components = __spreadArray(__spreadArray([], componentSet.children, true), ((baseComponentSet === null || baseComponentSet === void 0 ? void 0 : baseComponentSet.children) || []), true);
    var componentsMetadata = Object.fromEntries(Array.from(componentMetadata.entries()).filter(function (_a) {
        var key = _a[0];
        return components.map(function (child) { return child.id; }).includes(key);
    }));
    return {
        components: components,
        metadata: componentsMetadata,
    };
};
var getFileComponentTokens = function (fileId, accessToken, exportables) { return __awaiter(void 0, void 0, void 0, function () {
    var fileComponentSetsRes, err_1, componentSetsNodesRes, componentSets, componentMetadata, componentTokens, _i, exportables_1, exportable;
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 2, , 3]);
                return [4 /*yield*/, getComponentSets(fileId, accessToken)];
            case 1:
                fileComponentSetsRes = _c.sent();
                return [3 /*break*/, 3];
            case 2:
                err_1 = _c.sent();
                throw new Error('Handoff could not access the figma file. \n - Check your file id, dev token, and permissions. \n - For more information on permissions, see https://www.handoff.com/docs/guide');
            case 3:
                if (fileComponentSetsRes.data.meta.component_sets.length === 0) {
                    console.error(chalk.red('Handoff could not find any published components.\n  - If you expected components, please check to make sure you published them.\n  - You must have a paid license to publish components.\n - For more information, see https://www.handoff.com/docs/guide'));
                    console.log(chalk.blue('Continuing fetch with only colors and typography design foundations'));
                    return [2 /*return*/, {}];
                }
                return [4 /*yield*/, getComponentSetNodes(fileId, fileComponentSetsRes.data.meta.component_sets.map(function (item) { return item.node_id; }), accessToken)];
            case 4:
                componentSetsNodesRes = _c.sent();
                componentSets = Object.values(componentSetsNodesRes.data.nodes)
                    .map(function (node) { return node === null || node === void 0 ? void 0 : node.document; })
                    .filter(filterByNodeType('COMPONENT_SET'));
                componentMetadata = new Map(Object.entries((_a = Object.values(componentSetsNodesRes.data.nodes)
                    .map(function (node) {
                    return node === null || node === void 0 ? void 0 : node.components;
                })
                    .reduce(function (acc, cur) {
                    return __assign(__assign({}, acc), cur);
                })) !== null && _a !== void 0 ? _a : {}));
                componentTokens = {};
                for (_i = 0, exportables_1 = exportables; _i < exportables_1.length; _i++) {
                    exportable = exportables_1[_i];
                    if (!exportable.id) {
                        console.error(chalk.red('Handoff could not process exportable component without a id.\n  - Please update the exportable definition to include the name of the component.\n - For more information, see https://www.handoff.com/docs/guide'));
                        continue;
                    }
                    if (!exportable.options.exporter.search) {
                        console.error(chalk.red('Handoff could not process exportable component without search.\n  - Please update the exportable definition to include the search property.\n - For more information, see https://www.handoff.com/docs/guide'));
                        continue;
                    }
                    componentTokens[(_b = exportable.id) !== null && _b !== void 0 ? _b : ''] = extractComponents(getComponentSetComponents(fileComponentSetsRes.data.meta.component_sets, componentSets, componentMetadata, exportable.options.exporter.search), exportable);
                }
                return [2 /*return*/, componentTokens];
        }
    });
}); };
export default getFileComponentTokens;
