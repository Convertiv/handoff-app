"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.commands = void 0;
var app_1 = __importDefault(require("./build/app"));
var integration_1 = __importDefault(require("./build/integration"));
var recipe_1 = __importDefault(require("./build/recipe"));
var snippets_1 = __importDefault(require("./build/snippets"));
var dev_1 = __importDefault(require("./dev"));
var config_1 = __importDefault(require("./eject/config"));
var exportables_1 = __importDefault(require("./eject/exportables"));
var integration_2 = __importDefault(require("./eject/integration"));
var pages_1 = __importDefault(require("./eject/pages"));
var schemas_1 = __importDefault(require("./eject/schemas"));
var theme_1 = __importDefault(require("./eject/theme"));
var fetch_1 = __importDefault(require("./fetch"));
var exportable_1 = __importDefault(require("./make/exportable"));
var integration_3 = __importDefault(require("./make/integration"));
var page_1 = __importDefault(require("./make/page"));
var schema_1 = __importDefault(require("./make/schema"));
var snippet_1 = __importDefault(require("./make/snippet"));
var template_1 = __importDefault(require("./make/template"));
var snippet_2 = __importDefault(require("./rename/snippet"));
var start_1 = __importDefault(require("./start"));
exports.commands = [
    app_1.default,
    integration_1.default,
    recipe_1.default,
    snippets_1.default,
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
    snippet_1.default,
    template_1.default,
    snippet_2.default,
    start_1.default,
];
