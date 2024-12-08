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
exports.getFigmaFileDesignTokens = exports.toSDMachineName = exports.toMachineName = void 0;
const chalk_1 = __importDefault(require("chalk"));
const api_1 = require("../figma/api");
const convertColor_1 = require("../utils/convertColor");
const utils_1 = require("./utils");
/**
 * Create a machine name from a string
 * @param name
 * @returns string
 */
const toMachineName = (name) => {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9\s\-]/gi, '')
        .replace(/\s\-\s|\s+/gi, '-');
};
exports.toMachineName = toMachineName;
/**
 * Create a machine name from a string
 * @param name
 * @returns string
 */
const toSDMachineName = (name) => {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9\s\-]/gi, '-')
        .replace(/\s\-\s|\s+/gi, '-')
        .replace(/-+/gi, '-')
        .replace(/(^,)|(,$)/g, '');
};
exports.toSDMachineName = toSDMachineName;
/**
 * Extracts the group name and machine name from a string
 * @param name
 * @returns GroupNameData
 */
const fieldData = (name) => {
    let nameArray = name.split('/');
    const data = {
        name: '',
        machine_name: '',
        group: '',
    };
    if (nameArray[1]) {
        data.group = (0, exports.toMachineName)(nameArray[0]);
        data.name = nameArray[1];
        data.machine_name = (0, exports.toMachineName)(data.name);
    }
    else {
        data.name = nameArray[0];
        data.machine_name = (0, exports.toMachineName)(data.name);
    }
    return data;
};
/**
 * Checks if input is an array
 * @param input
 * @returns boolean
 */
const isArray = (input) => {
    return Array.isArray(input);
};
/**
 * Fetches design tokens from a Figma file
 * @param fileId
 * @param accessToken
 * @returns Promise <{ color: ColorObject[]; typography: TypographyObject[]; effect: EffectObject[]; }>
 */
const getFigmaFileDesignTokens = (fileId, accessToken) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const apiResponse = yield (0, api_1.getFileStyles)(fileId, accessToken);
        const file = apiResponse.data;
        const styles = file.meta.styles;
        const nodeMeta = styles.map((item) => ({
            node_id: item.node_id,
            sort_position: item.sort_position,
        }));
        const nodeIds = nodeMeta
            .sort((a, b) => {
            if (a.sort_position < b.sort_position) {
                return -1;
            }
            if (a.sort_position > b.sort_position) {
                return 1;
            }
            return 0;
        })
            .map((item) => item.node_id);
        const childrenApiResponse = yield (0, api_1.getFileNodes)(fileId, nodeIds, accessToken);
        const tokens = Object.entries(childrenApiResponse.data.nodes);
        const colorsArray = [];
        const effectsArray = [];
        const typographyArray = [];
        tokens.forEach(([_, node]) => {
            if (!node) {
                return;
            }
            let document = node.document;
            if (document.type === 'RECTANGLE') {
                let { name, machine_name, group } = fieldData(document.name);
                if (isArray(document.effects) && document.effects.length > 0) {
                    effectsArray.push({
                        id: document.id,
                        reference: `effect-${group}-${machine_name}`,
                        name,
                        machineName: machine_name,
                        group,
                        effects: document.effects
                            .filter((effect) => (0, utils_1.isValidEffectType)(effect.type) && effect.visible)
                            .map((effect) => ({
                            type: effect.type,
                            value: (0, utils_1.isShadowEffectType)(effect.type) ? (0, convertColor_1.transformFigmaEffectToCssBoxShadow)(effect) : '',
                        })),
                    });
                }
                else if (isArray(document.fills) &&
                    document.fills[0] &&
                    (document.fills[0].type === 'SOLID' || (0, utils_1.isValidGradientType)(document.fills[0].type))) {
                    const color = (0, convertColor_1.transformFigmaFillsToCssColor)(document.fills);
                    colorsArray.push({
                        id: document.id,
                        name,
                        group,
                        value: color.color,
                        blend: color.blend,
                        sass: `$color-${group}-${machine_name}`,
                        reference: `color-${group}-${machine_name}`,
                        machineName: machine_name,
                    });
                }
            }
            if (document.type === 'TEXT') {
                let { machine_name, group } = fieldData(document.name);
                let color;
                if (isArray(document.fills) && document.fills[0] && document.fills[0].type === 'SOLID' && document.fills[0].color) {
                    color = (0, convertColor_1.transformFigmaColorToHex)(document.fills[0].color);
                }
                typographyArray.push({
                    id: document.id,
                    reference: `typography-${group}-${machine_name}`,
                    name: document.name,
                    machine_name,
                    group,
                    values: Object.assign(Object.assign({}, document.style), { color }),
                });
            }
        });
        chalk_1.default.green('Colors, Effects and Typography Exported');
        const data = {
            color: colorsArray,
            effect: effectsArray,
            typography: typographyArray,
        };
        return data;
    }
    catch (err) {
        throw new Error('An error occured fetching Colors and Typography.  This typically happens when the library cannot be read from Handoff');
        return { color: [], typography: [], effect: [] };
    }
});
exports.getFigmaFileDesignTokens = getFigmaFileDesignTokens;
