"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const isEqual_1 = __importDefault(require("lodash/isEqual"));
const generateChangelogObjectArr = (prevArr, newArr, discriminator) => {
    return [
        // find items that exist in newArr but do not in prevArr and mark them as added
        ...newArr
            .filter((newItem) => !prevArr.find((prevItem) => prevItem[discriminator] === newItem[discriminator]))
            .map((newItem) => ({ type: 'add', object: newItem })),
        // find items that exist in prevArr but do not in newArr and mark them as deleted
        ...prevArr
            .filter((prevItem) => !newArr.find((newItem) => newItem[discriminator] === prevItem[discriminator]))
            .map((prevItem) => ({ type: 'delete', object: prevItem })),
        // find items that exist both in prevArr and newArr, and filter out equals
        ...newArr
            .filter((newItem) => prevArr.find((prevItem) => prevItem[discriminator] === newItem[discriminator]))
            .map((newItem) => {
            const prevItem = prevArr.find((prevItem) => prevItem[discriminator] === newItem[discriminator]);
            return { type: 'change', old: prevItem, new: newItem };
        })
            .filter((changeItem) => {
            return !(0, isEqual_1.default)(changeItem.old, changeItem.new);
        }),
    ];
};
const generateChangelogRecord = (prevDoc, newDoc) => {
    var _a, _b, _c, _d;
    const colors = generateChangelogObjectArr((_a = prevDoc === null || prevDoc === void 0 ? void 0 : prevDoc.design.color) !== null && _a !== void 0 ? _a : [], newDoc.design.color, 'sass');
    const typography = generateChangelogObjectArr((_b = prevDoc === null || prevDoc === void 0 ? void 0 : prevDoc.design.typography) !== null && _b !== void 0 ? _b : [], newDoc.design.typography, 'name');
    const design = colors.length || typography.length
        ? { colors: colors.length ? colors : undefined, typography: typography.length ? typography : undefined }
        : undefined;
    const icons = generateChangelogObjectArr((_c = prevDoc === null || prevDoc === void 0 ? void 0 : prevDoc.assets.icons) !== null && _c !== void 0 ? _c : [], newDoc.assets.icons, 'path');
    const logos = generateChangelogObjectArr((_d = prevDoc === null || prevDoc === void 0 ? void 0 : prevDoc.assets.logos) !== null && _d !== void 0 ? _d : [], newDoc.assets.logos, 'path');
    const assets = icons.length || logos.length ? { icons: icons.length ? icons : undefined, logos: logos.length ? logos : undefined } : undefined;
    if (assets || design) {
        return {
            timestamp: new Date().toISOString(),
            design,
            assets,
        };
    }
    return undefined;
};
exports.default = generateChangelogRecord;
