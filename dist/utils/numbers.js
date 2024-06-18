export var normalizeCssNumber = function (input) {
    if (input % 1 === 0) {
        return input.toString();
    }
    var rounded = parseFloat(input.toFixed(2));
    var roundedStr = rounded.toFixed(2);
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
