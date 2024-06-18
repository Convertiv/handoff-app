var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import isEqual from 'lodash/isEqual.js';
var generateChangelogObjectArr = function (prevArr, newArr, discriminator) {
    return __spreadArray(__spreadArray(__spreadArray([], newArr
        .filter(function (newItem) { return !prevArr.find(function (prevItem) { return prevItem[discriminator] === newItem[discriminator]; }); })
        .map(function (newItem) { return ({ type: 'add', object: newItem }); }), true), prevArr
        .filter(function (prevItem) { return !newArr.find(function (newItem) { return newItem[discriminator] === prevItem[discriminator]; }); })
        .map(function (prevItem) { return ({ type: 'delete', object: prevItem }); }), true), newArr
        .filter(function (newItem) { return prevArr.find(function (prevItem) { return prevItem[discriminator] === newItem[discriminator]; }); })
        .map(function (newItem) {
        var prevItem = prevArr.find(function (prevItem) { return prevItem[discriminator] === newItem[discriminator]; });
        return { type: 'change', old: prevItem, new: newItem };
    })
        .filter(function (changeItem) {
        return !isEqual(changeItem.old, changeItem.new);
    }), true);
};
var generateChangelogRecord = function (prevDoc, newDoc) {
    var _a, _b, _c, _d;
    var colors = generateChangelogObjectArr((_a = prevDoc === null || prevDoc === void 0 ? void 0 : prevDoc.design.color) !== null && _a !== void 0 ? _a : [], newDoc.design.color, 'sass');
    var typography = generateChangelogObjectArr((_b = prevDoc === null || prevDoc === void 0 ? void 0 : prevDoc.design.typography) !== null && _b !== void 0 ? _b : [], newDoc.design.typography, 'name');
    var design = colors.length || typography.length
        ? { colors: colors.length ? colors : undefined, typography: typography.length ? typography : undefined }
        : undefined;
    var icons = generateChangelogObjectArr((_c = prevDoc === null || prevDoc === void 0 ? void 0 : prevDoc.assets.icons) !== null && _c !== void 0 ? _c : [], newDoc.assets.icons, 'path');
    var logos = generateChangelogObjectArr((_d = prevDoc === null || prevDoc === void 0 ? void 0 : prevDoc.assets.logos) !== null && _d !== void 0 ? _d : [], newDoc.assets.logos, 'path');
    var assets = icons.length || logos.length ? { icons: icons.length ? icons : undefined, logos: logos.length ? logos : undefined } : undefined;
    if (assets || design) {
        return {
            timestamp: new Date().toISOString(),
            design: design,
            assets: assets,
        };
    }
    return undefined;
};
export default generateChangelogRecord;
