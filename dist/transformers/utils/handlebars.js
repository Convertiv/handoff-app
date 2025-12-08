"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHandlebarsContext = exports.registerHandlebarsHelpers = void 0;
const handlebars_1 = __importDefault(require("handlebars"));
const logger_1 = require("../../utils/logger");
/**
 * Registers common Handlebars helpers
 * @param data - Component data containing properties
 * @param injectFieldWrappers - Whether to inject field wrappers for inspection
 */
const registerHandlebarsHelpers = (data, injectFieldWrappers) => {
    // Field helper for property binding
    handlebars_1.default.registerHelper('field', function (field, options) {
        if (injectFieldWrappers) {
            if (!field) {
                logger_1.Logger.error(`Missing field declaration for ${data.id}`);
                return options.fn(this);
            }
            let parts = field.split('.');
            let current = data.properties;
            for (const part of parts) {
                if ((current === null || current === void 0 ? void 0 : current.type) === 'object')
                    current = current.properties;
                else if ((current === null || current === void 0 ? void 0 : current.type) === 'array')
                    current = current.items.properties;
                current = current === null || current === void 0 ? void 0 : current[part];
            }
            if (!current) {
                logger_1.Logger.error(`Undefined field path for ${data.id}`);
                return options.fn(this);
            }
            return new handlebars_1.default.SafeString(`<span class="handoff-field handoff-field-${(current === null || current === void 0 ? void 0 : current.type) || 'unknown'}" data-handoff-field="${field}" data-handoff="${encodeURIComponent(JSON.stringify(current))}">${options.fn(this)}</span>`);
        }
        else {
            return options.fn(this);
        }
    });
    // Equality helper
    handlebars_1.default.registerHelper('eq', function (a, b) {
        return a === b;
    });
};
exports.registerHandlebarsHelpers = registerHandlebarsHelpers;
/**
 * Creates Handlebars template context
 * @param data - Component data
 * @param previewData - Preview data with values
 * @returns Handlebars context object
 */
const createHandlebarsContext = (data, previewData) => {
    return {
        style: `<link rel="stylesheet" href="/api/component/shared.css"><link rel="stylesheet" href="/api/component/${data.id}.css">\n<link rel="stylesheet" href="/assets/css/preview.css">`,
        script: `<script src="/api/component/${data.id}.js"></script>\n<script src="/assets/js/preview.js"></script><script>var fields = ${JSON.stringify(data.properties)};</script>`,
        properties: previewData.values || {},
        fields: data.properties,
        title: data.title,
    };
};
exports.createHandlebarsContext = createHandlebarsContext;
