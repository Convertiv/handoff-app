"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenReferenceFormat = exports.transformComponentTokensToCssVariables = exports.transformComponentsToCssVariables = void 0;
const utils_1 = require("../utils");
const transformer_1 = require("../transformer");
const design_1 = require("../../exporters/design");
/**
 * Map down to a variable object
 * @param alerts
 * @returns
 */
const transformComponentsToCssVariables = (componentId, component, integrationOptions, handoff) => {
    var _a;
    const lines = [];
    const componentCssClass = (_a = integrationOptions === null || integrationOptions === void 0 ? void 0 : integrationOptions.cssRootClass) !== null && _a !== void 0 ? _a : componentId;
    lines.push(`.${componentCssClass} {`);
    const cssVars = component.instances.map((instance) => `\t${(0, utils_1.formatComponentCodeBlockComment)(instance, '/**/')}\n${(0, exports.transformComponentTokensToCssVariables)(instance, integrationOptions)
        .map((token) => `\t${token.name}: ${(0, exports.tokenReferenceFormat)(token, 'css', handoff)};`)
        .join('\n')}`);
    return lines.concat(cssVars).join('\n\n') + '\n}\n';
};
exports.transformComponentsToCssVariables = transformComponentsToCssVariables;
/**
 * Generate a list of css variables
 * @param tokens
 * @returns
 */
const transformComponentTokensToCssVariables = (component, options) => {
    return (0, transformer_1.transform)('css', component, options);
};
exports.transformComponentTokensToCssVariables = transformComponentTokensToCssVariables;
const tokenReferenceFormat = (token, type, handoff) => {
    if (!handoff || !handoff.config.useVariables)
        return token.value;
    let referenceObject = token.metadata.reference;
    let wrapped = '';
    if (referenceObject) {
        let reference = '';
        if (type === 'sd') {
            // build reference for style dictionary
            if (referenceObject.type === 'color') {
                reference = `color.${referenceObject.group}.${(0, design_1.toSDMachineName)(referenceObject.name)}`;
            }
            else if (referenceObject.type === 'effect') {
                reference = `effect.${referenceObject.group}.${(0, design_1.toSDMachineName)(referenceObject.name)}`;
            }
            else if (referenceObject.type === 'typography') {
                switch (token.metadata.cssProperty) {
                    case 'font-size':
                        reference = `typography.${(0, design_1.toSDMachineName)(referenceObject.name)}.font.size`;
                        break;
                    case 'font-weight':
                        reference = `typography.${(0, design_1.toSDMachineName)(referenceObject.name)}.font.weight`;
                        break;
                    case 'font-family':
                        reference = `typography.${(0, design_1.toSDMachineName)(referenceObject.name)}.font.family`;
                        break;
                    case 'line-height':
                        reference = `typography.${(0, design_1.toSDMachineName)(referenceObject.name)}.line.height`;
                        break;
                    case 'letter-spacing':
                        reference = `typography.${(0, design_1.toSDMachineName)(referenceObject.name)}.letter.spacing`;
                        break;
                }
            }
            return reference ? `{${reference}}` : token.value;
        }
        else {
            reference = referenceObject.reference;
            // There are some values that we can't yet tokenize because of the data out of figma
            if (['border-width', 'border-radius', 'border-style', 'text-align', 'text-decoration', 'text-transform'].includes(token.metadata.cssProperty)) {
                reference = undefined;
                // Some values should be suffixed with the css property
                // Everything on this list shouldn't, everything else should
            }
            else if (!['box-shadow', 'background', 'color', 'border-color'].includes(token.metadata.cssProperty)) {
                reference += `-${token.metadata.cssProperty}`;
            }
            wrapped = type === 'css' ? `var(--${reference})` : `$${reference}`;
        }
        return reference ? wrapped : token.value;
    }
    return token.value;
};
exports.tokenReferenceFormat = tokenReferenceFormat;
