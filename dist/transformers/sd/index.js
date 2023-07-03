"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var component_1 = require("./component");
// import transformColors from './design/colors';
// import transformEffects from './design/effects';
// import transformTypography from './design/typography';
function sdTransformer(documentationObject, options) {
    var components = {};
    for (var componentName in documentationObject.components) {
        components[componentName] = (0, component_1.transformComponentsToStyleDictionary)(componentName, documentationObject.components[componentName], options === null || options === void 0 ? void 0 : options.get(componentName));
    }
    // TODO
    var design = {
        colors: '',
        typography: '',
        effects: '',
    };
    return {
        components: components,
        design: design,
    };
}
exports.default = sdTransformer;
