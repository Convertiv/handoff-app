"use strict";
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
exports.createDocumentationObject = void 0;
const assets_1 = __importDefault(require("./exporters/assets"));
const index_1 = require("./exporters/components/index");
const design_1 = require("./exporters/design");
const startCase_1 = __importDefault(require("lodash/startCase"));
const chalk_1 = __importDefault(require("chalk"));
const createDocumentationObject = (handoff, legacyDefinitions) => __awaiter(void 0, void 0, void 0, function* () {
    const design = yield (0, design_1.getFigmaFileDesignTokens)(handoff.config.figma_project_id, handoff.config.dev_access_token);
    const icons = yield (0, assets_1.default)(handoff.config.figma_project_id, handoff.config.dev_access_token, 'Icons');
    const logos = yield (0, assets_1.default)(handoff.config.figma_project_id, handoff.config.dev_access_token, 'Logo');
    /// create a design map of node ids and references
    handoff.designMap = {
        colors: design.color.reduce((acc, color) => {
            acc[color.id] = {
                reference: color.reference,
                type: 'color',
                group: color.group,
                name: color.name,
            };
            return acc;
        }, {}),
        effects: design.effect.reduce((acc, effect) => {
            acc[effect.id] = {
                reference: effect.reference,
                group: effect.group,
                name: effect.name,
                type: 'effect',
            };
            return acc;
        }, {}),
        typography: design.typography.reduce((acc, typo) => {
            acc[typo.id] = {
                reference: typo.reference,
                type: 'typography',
                group: typo.group,
                name: typo.name,
            };
            return acc;
        }, {}),
    };
    const components = yield (0, index_1.getFigmaFileComponents)(handoff, legacyDefinitions);
    // Log out components
    Object.keys(components).map((component) => {
        if (components[component].instances.length === 0) {
            console.error(chalk_1.default.grey(`Skipping "${(0, startCase_1.default)(component)}". Reason: No matching component instances were found.`));
        }
        else {
            console.log(chalk_1.default.green(`${(0, startCase_1.default)(component)} exported:`), components[component].instances.length);
        }
    });
    return {
        timestamp: new Date().toISOString(),
        design,
        components,
        assets: {
            icons,
            logos,
        },
    };
});
exports.createDocumentationObject = createDocumentationObject;
