"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformComponentsToTailwind = void 0;
var utils_1 = require("../../utils");
/**
 * Transforms the component tokens into a style dictionary
 * @param alerts
 * @returns
 */
var transformComponentsToTailwind = function (_, components, options) {
    var sd = {};
    var tokenNamePartSeparator = '//'; // TODO: Temp
    components.forEach(function (component) {
        Object.entries((0, utils_1.transformComponentTokens)(component, options)).forEach(function (_a) {
            var tokenName = _a[0], tokenValue = _a[1];
            console.log(tokenName);
            var path = tokenName.split(tokenNamePartSeparator); // TODO: Improve/remove by returning the property name structure?
            var lastIdx = path.length - 1;
            var componentName = path[0];
            var componentType = path[1];
            var componentState = path[2];
            var className = ".".concat(componentName, "-").concat(componentType);
            var ref = sd;
            if (!ref[className])
                ref[className] = {};
            var propParts = path[lastIdx].split('-');
            var key = "".concat(propParts[0]).concat(propParts
                .slice(1)
                .map(function (el) { return el.charAt(0).toUpperCase() + el.slice(1); })
                .join(''));
            if (componentState === 'default') {
                ref[className][key] = tokenValue.value;
            }
            else {
                if (!ref[className]["$".concat(componentState)])
                    ref[className]["$".concat(componentState)] = {};
                ref[className]["$".concat(componentState)][key] = tokenValue.value;
            }
        });
    });
    return "module.exports = ".concat(JSON.stringify(sd, null, 2), ";");
};
exports.transformComponentsToTailwind = transformComponentsToTailwind;
