"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeCssNumber = void 0;
const normalizeCssNumber = (input) => {
    if (input % 1 === 0) {
        return input.toString();
    }
    let rounded = parseFloat(input.toFixed(3));
    let roundedStr = rounded.toFixed(3);
    if (rounded === 0) {
        return '0';
    }
    // Remove trailing zeros
    roundedStr = parseFloat(roundedStr).toString();
    if (Math.abs(rounded) < 1) {
        return rounded < 0 ? '-' + roundedStr.slice(2) : roundedStr.slice(1);
    }
    return roundedStr;
};
exports.normalizeCssNumber = normalizeCssNumber;
