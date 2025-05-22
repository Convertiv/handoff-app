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
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const colors = generateChangelogObjectArr((_b = (_a = prevDoc === null || prevDoc === void 0 ? void 0 : prevDoc.localStyles) === null || _a === void 0 ? void 0 : _a.color) !== null && _b !== void 0 ? _b : [], (_c = newDoc.localStyles) === null || _c === void 0 ? void 0 : _c.color, 'sass');
    const typography = generateChangelogObjectArr((_e = (_d = prevDoc === null || prevDoc === void 0 ? void 0 : prevDoc.localStyles) === null || _d === void 0 ? void 0 : _d.typography) !== null && _e !== void 0 ? _e : [], (_f = newDoc.localStyles) === null || _f === void 0 ? void 0 : _f.typography, 'name');
    const design = colors.length || typography.length
        ? { colors: colors.length ? colors : undefined, typography: typography.length ? typography : undefined }
        : undefined;
    const icons = generateChangelogObjectArr((_g = prevDoc === null || prevDoc === void 0 ? void 0 : prevDoc.assets.icons) !== null && _g !== void 0 ? _g : [], newDoc.assets.icons, 'path');
    const logos = generateChangelogObjectArr((_h = prevDoc === null || prevDoc === void 0 ? void 0 : prevDoc.assets.logos) !== null && _h !== void 0 ? _h : [], newDoc.assets.logos, 'path');
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
