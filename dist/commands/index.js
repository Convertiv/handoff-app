"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.commands = void 0;
const app_1 = __importDefault(require("./build/app"));
const components_1 = __importDefault(require("./build/components"));
const dev_1 = __importDefault(require("./dev"));
const config_1 = __importDefault(require("./eject/config"));
const pages_1 = __importDefault(require("./eject/pages"));
const theme_1 = __importDefault(require("./eject/theme"));
const fetch_1 = __importDefault(require("./fetch"));
const component_1 = __importDefault(require("./make/component"));
const page_1 = __importDefault(require("./make/page"));
const template_1 = __importDefault(require("./make/template"));
const scaffold_1 = __importDefault(require("./scaffold"));
const start_1 = __importDefault(require("./start"));
const components_2 = __importDefault(require("./validate/components"));
exports.commands = [
    app_1.default,
    components_1.default,
    dev_1.default,
    config_1.default,
    pages_1.default,
    theme_1.default,
    fetch_1.default,
    page_1.default,
    component_1.default,
    template_1.default,
    scaffold_1.default,
    start_1.default,
    components_2.default,
];
