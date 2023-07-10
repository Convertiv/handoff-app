"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.componentMapFile = exports.transformComponentsToTailwind = void 0;
var transformer_1 = require("../../transformer");
/**
 * Transforms the component tokens into a style dictionary
 * @param alerts
 * @returns
 */
var transformComponentsToTailwind = function (_, components, options) {
    var sd = {};
    components.forEach(function (component) {
        var tokens = (0, transformer_1.transform)('sd', component, options);
        Object.entries(tokens).forEach(function (_a) {
            var _ = _a[0], tokenValue = _a[1];
            var metadata = tokenValue.metadata;
            var lastIdx = tokenValue.metadata.propertyPath.length - 1;
            var componentName = metadata.name;
            var componentType = metadata.variant;
            var componentState = metadata.state;
            var componentActivity = metadata.activity;
            if (metadata.type !== 'design')
                return;
            var part = metadata.part;
            var className = ".".concat(componentName);
            if (componentType !== '')
                className = "".concat(className, "-").concat(componentType);
            if (part !== '$' && part !== '')
                className = "".concat(className, "-").concat(part);
            var ref = sd;
            if (!ref[className])
                ref[className] = {};
            var propParts = tokenValue.metadata.propertyPath[lastIdx].split('-');
            var key = "".concat(propParts[0]).concat(propParts
                .slice(1)
                .map(function (el) { return el.charAt(0).toUpperCase() + el.slice(1); })
                .join(''));
            if (componentState === 'default' || componentState === 'off' || !componentState) {
                ref[className][key] = tokenValue.value;
            }
            else if (componentActivity === 'on') {
                if (!ref[className]["&:checked"])
                    ref[className]["&:checked"] = {};
                ref[className]["&:checked"][key] = tokenValue.value;
            }
            else {
                if (!ref[className]["&:".concat(componentState)])
                    ref[className]["&:".concat(componentState)] = {};
                ref[className]["&:".concat(componentState)][key] = tokenValue.value;
            }
        });
    });
    return "module.exports = ".concat(JSON.stringify(sd, null, 2), ";");
};
exports.transformComponentsToTailwind = transformComponentsToTailwind;
var componentMapFile = function (components) {
    var output = "";
    for (var componentName in components) {
        output += "const ".concat(componentName, "Components = require('./").concat(componentName, "');\n");
    }
    output += "const createComponentMap = () => {\n    const componentMap = {\n";
    for (var componentName in components) {
        output += "      ...".concat(componentName, "Components,\n");
    }
    ;
    output += "  };\n  return componentMap;\n  };\n\nmodule.exports = createComponentMap;";
    return output;
};
exports.componentMapFile = componentMapFile;
