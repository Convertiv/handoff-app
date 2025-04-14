"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.commands = void 0;
const app_1 = __importDefault(require("./build/app"));
const components_1 = __importDefault(require("./build/components"));
const integration_1 = __importDefault(require("./build/integration"));
const recipe_1 = __importDefault(require("./build/recipe"));
const dev_1 = __importDefault(require("./dev"));
const config_1 = __importDefault(require("./eject/config"));
const exportables_1 = __importDefault(require("./eject/exportables"));
const integration_2 = __importDefault(require("./eject/integration"));
const pages_1 = __importDefault(require("./eject/pages"));
const schemas_1 = __importDefault(require("./eject/schemas"));
const theme_1 = __importDefault(require("./eject/theme"));
const fetch_1 = __importDefault(require("./fetch"));
const component_1 = __importDefault(require("./make/component"));
const exportable_1 = __importDefault(require("./make/exportable"));
const integration_3 = __importDefault(require("./make/integration"));
const integrationStyles_1 = __importDefault(require("./make/integrationStyles"));
const page_1 = __importDefault(require("./make/page"));
const schema_1 = __importDefault(require("./make/schema"));
const template_1 = __importDefault(require("./make/template"));
const component_2 = __importDefault(require("./rename/component"));
const start_1 = __importDefault(require("./start"));
const components_2 = __importDefault(require("./validate/components"));
exports.commands = [
    app_1.default,
    integration_1.default,
    recipe_1.default,
    components_1.default,
    dev_1.default,
    config_1.default,
    exportables_1.default,
    integration_2.default,
    pages_1.default,
    schemas_1.default,
    theme_1.default,
    fetch_1.default,
    exportable_1.default,
    integration_3.default,
    page_1.default,
    schema_1.default,
    component_1.default,
    template_1.default,
    component_2.default,
    integrationStyles_1.default,
    start_1.default,
    components_2.default,
];
