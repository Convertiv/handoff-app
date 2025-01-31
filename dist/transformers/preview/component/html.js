"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const handlebars_1 = __importDefault(require("handlebars"));
const node_html_parser_1 = require("node-html-parser");
const path_1 = __importDefault(require("path"));
const prettier = __importStar(require("prettier"));
const trimPreview = (preview) => {
    const bodyEl = (0, node_html_parser_1.parse)(preview).querySelector('body');
    const code = bodyEl ? bodyEl.innerHTML.trim() : preview;
    return code;
};
const buildPreviews = (data, id, custom, publicPath, handoff) => __awaiter(void 0, void 0, void 0, function* () {
    const template = yield fs_extra_1.default.readFile(path_1.default.resolve(custom, `${id}.hbs`), 'utf8');
    try {
        const previews = {};
        let injectFieldWrappers = false;
        handlebars_1.default.registerHelper('field', function (field, options) {
            if (injectFieldWrappers) {
                if (!field) {
                    console.log(chalk_1.default.red(`When processing previews for ${id}, a field block is declared but no field is provided`));
                    return options.fn(this);
                }
                let parts = field.split('.');
                // iterate through the parts and find the field
                let current = data.properties;
                for (const part of parts) {
                    if (current) {
                        if (current.type && current.type === 'object') {
                            current = current.properties;
                        }
                        else if (current.type && current.type === 'array') {
                            current = current.items.properties;
                        }
                    }
                    if (current[part]) {
                        current = current[part];
                    }
                }
                if (!current) {
                    console.log(chalk_1.default.red(`When processing previews for ${id}, a field block is declared but undefined`));
                    return options.fn(this);
                }
                return new handlebars_1.default.SafeString(`<span class="handoff-field handoff-field-${(current === null || current === void 0 ? void 0 : current.type) ? current.type : 'unknown'}" data-handoff-field="${field}" data-handoff="${encodeURIComponent(JSON.stringify(current))}">` +
                    options.fn(this) +
                    '</span>');
            }
            else {
                return options.fn(this);
            }
        });
        const html = data.previews['generic'] ? yield buildPreview(id, template, data.previews['generic'], data) : '';
        injectFieldWrappers = true;
        for (const previewKey in data.previews) {
            data.previews[previewKey].url = id + `-${previewKey}.html`;
            previews[previewKey] = yield buildPreview(id, template, data.previews[previewKey], data);
            const publicFile = path_1.default.resolve(publicPath, id + '-' + previewKey + '.html');
            yield fs_extra_1.default.writeFile(publicFile, previews[previewKey]);
        }
        data.preview = '';
        data.code = trimPreview(template);
        data.html = trimPreview(html);
        // discard shared styles from the css output
    }
    catch (e) {
        console.log(e);
        // write the preview to the public folder
        throw new Error('stop');
    }
    return data;
});
const buildPreview = (id, template, preview, data) => __awaiter(void 0, void 0, void 0, function* () {
    const rendered = yield prettier.format(handlebars_1.default.compile(template)({
        style: `<link rel="stylesheet" href="/api/component/shared.css"><link rel="stylesheet" href="/api/component/${id}.css"><link rel="stylesheet" href="/api/component/${id}.css">\n<link rel="stylesheet" href="/assets/css/preview.css">`,
        script: `<script src="/api/component/${id}.js"></script>\n<script src="/assets/js/preview.js"></script><script>var fields = ${JSON.stringify(data.properties)};</script>`,
        properties: preview.values || {},
        fields: ensureIds(data.properties),
    }), { parser: 'html' });
    return rendered;
});
const ensureIds = (properties) => {
    var _a;
    for (const key in properties) {
        properties[key].id = key;
        if ((_a = properties[key].items) === null || _a === void 0 ? void 0 : _a.properties) {
            ensureIds(properties[key].items.properties);
        }
        if (properties[key].properties) {
            ensureIds(properties[key].properties);
        }
    }
    return properties;
};
exports.default = buildPreviews;
