var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import { transformComponentsToMap } from './component';
import transformColors from './design/colors';
import transformEffects from './design/effects';
import transformTypography from './design/typography';
export default function mapTransformer(documentationObject) {
    var flatMap = {};
    var components = {};
    for (var componentId in documentationObject.components) {
        var map = transformComponentsToMap(componentId, documentationObject.components[componentId]);
        components[componentId] = JSON.stringify(map, null, 2);
        flatMap = __assign(__assign({}, flatMap), map);
    }
    var colors = transformColors(documentationObject.design.color);
    var typography = transformTypography(documentationObject.design.typography);
    var effects = transformEffects(documentationObject.design.effect);
    flatMap = __assign(__assign(__assign(__assign({}, flatMap), colors), typography), effects);
    return {
        components: components,
        design: {
            colors: JSON.stringify(colors, null, 2),
            typography: JSON.stringify(typography, null, 2),
            effects: JSON.stringify(effects, null, 2),
        },
        attachments: {
            "tokens-map": JSON.stringify(flatMap, null, 2),
        }
    };
}
