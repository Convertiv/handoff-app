"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toLowerCaseKeysAndValues = void 0;
const toLowerCaseKeysAndValues = (obj) => {
    const loweredObj = {};
    for (const key in obj) {
        const lowerKey = key.toLowerCase();
        const value = obj[key];
        if (typeof value === 'string') {
            loweredObj[lowerKey] = value.toLowerCase();
        }
        else if (typeof value === 'object' && value !== null) {
            loweredObj[lowerKey] = (0, exports.toLowerCaseKeysAndValues)(value);
        }
        else {
            loweredObj[lowerKey] = value; // For non-string values
        }
    }
    return loweredObj;
};
exports.toLowerCaseKeysAndValues = toLowerCaseKeysAndValues;
