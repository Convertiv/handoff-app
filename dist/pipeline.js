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
exports.buildIntegrationOnly = exports.buildRecipe = exports.buildComponents = exports.readPrevJSONFile = exports.logosZipFilePath = exports.iconsZipFilePath = exports.variablesFilePath = exports.changelogFilePath = exports.previewFilePath = exports.tokensFilePath = exports.outputPath = void 0;
const chalk_1 = __importDefault(require("chalk"));
require("dotenv/config");
const fs_extra_1 = __importDefault(require("fs-extra"));
const lodash_1 = require("lodash");
const stream = __importStar(require("node:stream"));
const path_1 = __importDefault(require("path"));
const api_1 = require("./api");
const app_1 = __importDefault(require("./app"));
const changelog_1 = __importDefault(require("./changelog"));
const documentation_object_1 = require("./documentation-object");
const api_2 = require("./figma/api");
const index_1 = __importDefault(require("./transformers/css/index"));
const index_2 = __importDefault(require("./transformers/font/index"));
const index_3 = __importStar(require("./transformers/integration/index"));
const map_1 = __importDefault(require("./transformers/map"));
const component_1 = require("./transformers/preview/component");
const index_4 = __importDefault(require("./transformers/preview/index"));
const index_5 = __importStar(require("./transformers/scss/index"));
const sd_1 = __importDefault(require("./transformers/sd"));
const tokens_1 = require("./transformers/tokens");
const utils_1 = require("./utils");
const fs_1 = require("./utils/fs");
const prompt_1 = require("./utils/prompt");
let config;
const outputPath = (handoff) => path_1.default.resolve(handoff.workingPath, handoff.exportsDirectory, handoff.config.figma_project_id);
exports.outputPath = outputPath;
const tokensFilePath = (handoff) => path_1.default.join((0, exports.outputPath)(handoff), 'tokens.json');
exports.tokensFilePath = tokensFilePath;
const previewFilePath = (handoff) => path_1.default.join((0, exports.outputPath)(handoff), 'preview.json');
exports.previewFilePath = previewFilePath;
const changelogFilePath = (handoff) => path_1.default.join((0, exports.outputPath)(handoff), 'changelog.json');
exports.changelogFilePath = changelogFilePath;
const variablesFilePath = (handoff) => path_1.default.join((0, exports.outputPath)(handoff), 'tokens');
exports.variablesFilePath = variablesFilePath;
const iconsZipFilePath = (handoff) => path_1.default.join((0, exports.outputPath)(handoff), 'icons.zip');
exports.iconsZipFilePath = iconsZipFilePath;
const logosZipFilePath = (handoff) => path_1.default.join((0, exports.outputPath)(handoff), 'logos.zip');
exports.logosZipFilePath = logosZipFilePath;
/**
 * Read Previous Json File
 * @param path
 * @returns
 */
const readPrevJSONFile = (path) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return yield fs_extra_1.default.readJSON(path);
    }
    catch (e) {
        return undefined;
    }
});
exports.readPrevJSONFile = readPrevJSONFile;
/**
 * Build just the custom fonts
 * @param documentationObject
 * @returns
 */
const buildCustomFonts = (handoff, documentationObject) => __awaiter(void 0, void 0, void 0, function* () {
    return yield (0, index_2.default)(handoff, documentationObject);
});
/**
 * Build integration
 * @param documentationObject
 * @returns
 */
const buildIntegration = (handoff, documentationObject) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, index_3.default)(handoff, documentationObject);
});
/**
 * Build previews
 * @param documentationObject
 * @returns
 */
const buildPreviews = (handoff, documentationObject) => __awaiter(void 0, void 0, void 0, function* () {
    yield Promise.all([
        (0, index_4.default)(handoff, documentationObject).then((out) => fs_extra_1.default.writeJSON((0, exports.previewFilePath)(handoff), out, { spaces: 2 })),
    ]);
});
/**
 * Build previews
 * @param documentationObject
 * @returns
 */
const buildComponents = (handoff) => __awaiter(void 0, void 0, void 0, function* () {
    const documentationObject = yield (0, exports.readPrevJSONFile)((0, exports.tokensFilePath)(handoff));
    yield Promise.all([(0, component_1.componentTransformer)(handoff, documentationObject.components)]);
});
exports.buildComponents = buildComponents;
/**
 * Build only the styles pipeline
 * @param documentationObject
 */
const buildStyles = (handoff, documentationObject) => __awaiter(void 0, void 0, void 0, function* () {
    let typeFiles = (0, index_5.scssTypesTransformer)(documentationObject, handoff.integrationObject);
    typeFiles = handoff.hooks.typeTransformer(documentationObject, typeFiles);
    let cssFiles = (0, index_1.default)(documentationObject, handoff, handoff.integrationObject);
    cssFiles = handoff.hooks.cssTransformer(documentationObject, cssFiles);
    let scssFiles = (0, index_5.default)(documentationObject, handoff, handoff.integrationObject);
    scssFiles = handoff.hooks.scssTransformer(documentationObject, scssFiles);
    let sdFiles = (0, sd_1.default)(documentationObject, handoff, handoff.integrationObject);
    sdFiles = handoff.hooks.styleDictionaryTransformer(documentationObject, sdFiles);
    let mapFiles = (0, map_1.default)(documentationObject, handoff.integrationObject);
    mapFiles = handoff.hooks.mapTransformer(documentationObject, mapFiles);
    yield Promise.all([
        fs_extra_1.default
            .ensureDir((0, exports.variablesFilePath)(handoff))
            .then(() => fs_extra_1.default.ensureDir(`${(0, exports.variablesFilePath)(handoff)}/types`))
            .then(() => fs_extra_1.default.ensureDir(`${(0, exports.variablesFilePath)(handoff)}/css`))
            .then(() => fs_extra_1.default.ensureDir(`${(0, exports.variablesFilePath)(handoff)}/sass`))
            .then(() => fs_extra_1.default.ensureDir(`${(0, exports.variablesFilePath)(handoff)}/sd/tokens`))
            .then(() => fs_extra_1.default.ensureDir(`${(0, exports.variablesFilePath)(handoff)}/maps`))
            .then(() => Promise.all(Object.entries(sdFiles.components).map(([name, _]) => fs_extra_1.default.ensureDir(`${(0, exports.variablesFilePath)(handoff)}/sd/tokens/${name}`))))
            .then(() => Promise.all(Object.entries(typeFiles.components).map(([name, content]) => fs_extra_1.default.writeFile(`${(0, exports.variablesFilePath)(handoff)}/types/${name}.scss`, content))))
            .then(() => Promise.all(Object.entries(typeFiles.design).map(([name, content]) => fs_extra_1.default.writeFile(`${(0, exports.variablesFilePath)(handoff)}/types/${name}.scss`, content))))
            .then(() => Promise.all(Object.entries(cssFiles.components).map(([name, content]) => fs_extra_1.default.writeFile(`${(0, exports.variablesFilePath)(handoff)}/css/${name}.css`, content))))
            .then(() => Promise.all(Object.entries(cssFiles.design).map(([name, content]) => fs_extra_1.default.writeFile(`${(0, exports.variablesFilePath)(handoff)}/css/${name}.css`, content))))
            .then(() => Promise.all(Object.entries(scssFiles.components).map(([name, content]) => fs_extra_1.default.writeFile(`${(0, exports.variablesFilePath)(handoff)}/sass/${name}.scss`, content))))
            .then(() => Promise.all(Object.entries(scssFiles.design).map(([name, content]) => fs_extra_1.default.writeFile(`${(0, exports.variablesFilePath)(handoff)}/sass/${name}.scss`, content))))
            .then(() => Promise.all(Object.entries(sdFiles.components).map(([name, content]) => fs_extra_1.default.writeFile(`${(0, exports.variablesFilePath)(handoff)}/sd/tokens/${name}/${name}.tokens.json`, content))))
            .then(() => Promise.all(Object.entries(sdFiles.design).map(([name, content]) => fs_extra_1.default.writeFile(`${(0, exports.variablesFilePath)(handoff)}/sd/tokens/${name}.tokens.json`, content))))
            .then(() => Promise.all(Object.entries(mapFiles.components).map(([name, content]) => fs_extra_1.default.writeFile(`${(0, exports.variablesFilePath)(handoff)}/maps/${name}.json`, content))))
            .then(() => Promise.all(Object.entries(mapFiles.design).map(([name, content]) => fs_extra_1.default.writeFile(`${(0, exports.variablesFilePath)(handoff)}/maps/${name}.json`, content))))
            .then(() => Promise.all(Object.entries(mapFiles.attachments).map(([name, content]) => fs_extra_1.default.writeFile(`${(0, exports.outputPath)(handoff)}/${name}.json`, content)))),
    ]);
});
const validateHandoffRequirements = (handoff) => __awaiter(void 0, void 0, void 0, function* () {
    let requirements = false;
    const result = process.versions;
    if (result && result.node) {
        if (parseInt(result.node) >= 16) {
            requirements = true;
        }
    }
    else {
        // couldn't find the right version, but ...
    }
    if (!requirements) {
        console.log(chalk_1.default.redBright('Handoff Installation failed'));
        console.log(chalk_1.default.yellow('- Please update node to at least Node 16 https://nodejs.org/en/download. \n- You can read more about installing handoff at https://www.handoff.com/docs/'));
        throw new Error('Could not run handoff');
    }
});
/**
 * Validate the figma auth tokens
 * @param handoff
 */
const validateFigmaAuth = (handoff) => __awaiter(void 0, void 0, void 0, function* () {
    let DEV_ACCESS_TOKEN = handoff.config.dev_access_token;
    let FIGMA_PROJECT_ID = handoff.config.figma_project_id;
    if (DEV_ACCESS_TOKEN && FIGMA_PROJECT_ID) {
        return;
    }
    let missingEnvVars = false;
    if (!DEV_ACCESS_TOKEN) {
        missingEnvVars = true;
        console.log(chalk_1.default.yellow(`Figma developer access token not found. You can supply it as an environment variable or .env file at HANDOFF_DEV_ACCESS_TOKEN.
Use these instructions to generate them ${chalk_1.default.blue(`https://help.figma.com/hc/en-us/articles/8085703771159-Manage-personal-access-tokens`)}\n`));
        DEV_ACCESS_TOKEN = yield (0, prompt_1.maskPrompt)(chalk_1.default.green('Figma Developer Key: '));
    }
    if (!FIGMA_PROJECT_ID) {
        missingEnvVars = true;
        console.log(chalk_1.default.yellow(`\n\nFigma project id not found. You can supply it as an environment variable or .env file at HANDOFF_FIGMA_PROJECT_ID.
You can find this by looking at the url of your Figma file. If the url is ${chalk_1.default.blue(`https://www.figma.com/file/IGYfyraLDa0BpVXkxHY2tE/Starter-%5BV2%5D`)}
your id would be IGYfyraLDa0BpVXkxHY2tE\n`));
        FIGMA_PROJECT_ID = yield (0, prompt_1.maskPrompt)(chalk_1.default.green('Figma Project Id: '));
    }
    if (missingEnvVars) {
        console.log(chalk_1.default.yellow(`\n\nYou supplied at least one required variable. We can write these variables to a local env file for you to make it easier to run the pipeline in the future.\n`));
        const writeEnvFile = yield (0, prompt_1.prompt)(chalk_1.default.green('Write environment variables to .env file? (y/n): '));
        if (writeEnvFile !== 'y') {
            console.log(chalk_1.default.green(`Skipping .env file creation. You will need to supply these variables in the future.\n`));
        }
        else {
            const envFilePath = path_1.default.resolve(handoff.workingPath, '.env');
            const envFileContent = `
HANDOFF_DEV_ACCESS_TOKEN="${DEV_ACCESS_TOKEN}"
HANDOFF_FIGMA_PROJECT_ID="${FIGMA_PROJECT_ID}"
`;
            try {
                const fileExists = yield fs_extra_1.default
                    .access(envFilePath)
                    .then(() => true)
                    .catch(() => false);
                if (fileExists) {
                    yield fs_extra_1.default.appendFile(envFilePath, envFileContent);
                    console.log(chalk_1.default.green(`\nThe .env file was found and updated with new content. Since these are sensitive variables, please do not commit this file.\n`));
                }
                else {
                    yield fs_extra_1.default.writeFile(envFilePath, envFileContent.replace(/^\s*[\r\n]/gm, ''));
                    console.log(chalk_1.default.green(`\nAn .env file was created in the root of your project. Since these are sensitive variables, please do not commit this file.\n`));
                }
            }
            catch (error) {
                console.error(chalk_1.default.red('Error handling the .env file:', error));
            }
        }
    }
    handoff.config.dev_access_token = DEV_ACCESS_TOKEN;
    handoff.config.figma_project_id = FIGMA_PROJECT_ID;
});
const figmaExtract = (handoff) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(chalk_1.default.green(`Starting Figma data extraction.`));
    let prevDocumentationObject = yield (0, exports.readPrevJSONFile)((0, exports.tokensFilePath)(handoff));
    let changelog = (yield (0, exports.readPrevJSONFile)((0, exports.changelogFilePath)(handoff))) || [];
    yield fs_extra_1.default.emptyDir((0, exports.outputPath)(handoff));
    const legacyDefinitions = yield getLegacyDefinitions(handoff);
    const documentationObject = yield (0, documentation_object_1.createDocumentationObject)(handoff, legacyDefinitions);
    const changelogRecord = (0, changelog_1.default)(prevDocumentationObject, documentationObject);
    if (changelogRecord) {
        changelog = [changelogRecord, ...changelog];
    }
    handoff.hooks.build(documentationObject);
    yield Promise.all([
        fs_extra_1.default.writeJSON((0, exports.tokensFilePath)(handoff), documentationObject, { spaces: 2 }),
        fs_extra_1.default.writeJSON((0, exports.changelogFilePath)(handoff), changelog, { spaces: 2 }),
        ...(!process.env.HANDOFF_CREATE_ASSETS_ZIP_FILES || process.env.HANDOFF_CREATE_ASSETS_ZIP_FILES !== 'false'
            ? [
                (0, api_1.zipAssets)(documentationObject.assets.icons, fs_extra_1.default.createWriteStream((0, exports.iconsZipFilePath)(handoff))).then((writeStream) => stream.promises.finished(writeStream)),
                (0, api_1.zipAssets)(documentationObject.assets.logos, fs_extra_1.default.createWriteStream((0, exports.logosZipFilePath)(handoff))).then((writeStream) => stream.promises.finished(writeStream)),
            ]
            : []),
    ]);
    // define the output folder
    const outputFolder = path_1.default.resolve(handoff.modulePath, '.handoff', `${handoff.config.figma_project_id}`, 'public');
    // ensure output folder exists
    if (!fs_extra_1.default.existsSync(outputFolder)) {
        yield fs_extra_1.default.promises.mkdir(outputFolder, { recursive: true });
    }
    // copy assets to output folder
    fs_extra_1.default.copyFileSync((0, exports.iconsZipFilePath)(handoff), path_1.default.join(handoff.modulePath, '.handoff', `${handoff.config.figma_project_id}`, 'public', 'icons.zip'));
    fs_extra_1.default.copyFileSync((0, exports.logosZipFilePath)(handoff), path_1.default.join(handoff.modulePath, '.handoff', `${handoff.config.figma_project_id}`, 'public', 'logos.zip'));
    return documentationObject;
});
const buildRecipe = (handoff) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const TOKEN_REGEX = /{{\s*(scss-token|css-token|value)\s+"([^"]*)"\s+"([^"]*)"\s+"([^"]*)"\s+"([^"]*)"\s*}}/;
    const processToken = (content, records) => {
        var _a;
        let match;
        const regex = new RegExp(TOKEN_REGEX, 'g');
        while ((match = regex.exec(content)) !== null) {
            const [_, __, component, part, variants, cssProperty] = match;
            let componentRecord = records.components.find((c) => c.name === component);
            if (!componentRecord) {
                componentRecord = { name: component, common: { parts: [] }, recipes: [] };
                records.components.push(componentRecord);
            }
            const requiredTokenSet = (0, tokens_1.getTokenSetNameByProperty)(cssProperty);
            const existingPartIndex = ((_a = componentRecord.common.parts) !== null && _a !== void 0 ? _a : []).findIndex((p) => typeof p !== 'string' && p.name === part);
            if (existingPartIndex === -1) {
                componentRecord.common.parts.push({
                    name: part,
                    require: [(0, tokens_1.getTokenSetNameByProperty)(cssProperty)].filter(utils_1.filterOutUndefined),
                });
            }
            else if (requiredTokenSet && !componentRecord.common.parts[existingPartIndex].require.includes(requiredTokenSet)) {
                componentRecord.common.parts[existingPartIndex].require = [
                    ...componentRecord.common.parts[existingPartIndex].require,
                    requiredTokenSet,
                ];
            }
            const variantPairs = variants.split(',').map((v) => v.split(':'));
            const variantGroup = { variantProps: [], variantValues: {} };
            variantPairs.forEach(([key, value]) => {
                if (!variantGroup.variantProps.includes(key)) {
                    variantGroup.variantProps.push(key);
                }
                if (!variantGroup.variantValues[key]) {
                    variantGroup.variantValues[key] = [];
                }
                if (/^[a-zA-Z0-9]+$/.test(value) && !variantGroup.variantValues[key].includes(value)) {
                    variantGroup.variantValues[key].push(value);
                }
            });
            const existingGroupIndex = componentRecord.recipes.findIndex((recipe) => recipe.require.variantProps.length === variantGroup.variantProps.length &&
                recipe.require.variantProps.every((prop) => variantGroup.variantProps.includes(prop)) &&
                Object.keys(recipe.require.variantValues).every((key) => {
                    var _a;
                    return recipe.require.variantValues[key].length === ((_a = variantGroup.variantValues[key]) === null || _a === void 0 ? void 0 : _a.length) &&
                        recipe.require.variantValues[key].every((val) => variantGroup.variantValues[key].includes(val));
                }));
            if (existingGroupIndex === -1) {
                componentRecord.recipes.push({ require: variantGroup });
            }
        }
    };
    const traverseDirectory = (directory, records) => {
        const files = fs_extra_1.default.readdirSync(directory);
        files.forEach((file) => {
            const fullPath = path_1.default.join(directory, file);
            const stat = fs_extra_1.default.statSync(fullPath);
            if (stat.isDirectory()) {
                traverseDirectory(fullPath, records);
            }
            else if (stat.isFile()) {
                const content = fs_extra_1.default.readFileSync(fullPath, 'utf8');
                processToken(content, records);
            }
        });
    };
    const integrationPath = (0, index_3.getPathToIntegration)(handoff, false);
    if (!integrationPath) {
        console.log(chalk_1.default.yellow('Unable to build integration recipe. Reason: Integration not found.'));
        return;
    }
    const directoryToTraverse = (_b = (_a = handoff === null || handoff === void 0 ? void 0 : handoff.integrationObject) === null || _a === void 0 ? void 0 : _a.entries) === null || _b === void 0 ? void 0 : _b.integration;
    if (!directoryToTraverse) {
        console.log(chalk_1.default.yellow('Unable to build integration recipe. Reason: Integration entry not specified.'));
        return;
    }
    const componentRecords = { components: [] };
    traverseDirectory(directoryToTraverse, componentRecords);
    componentRecords.components.forEach((component) => {
        component.common.parts.sort();
    });
    const writePath = path_1.default.resolve(handoff.workingPath, 'recipes.json');
    yield fs_extra_1.default.writeFile(writePath, JSON.stringify(componentRecords, null, 2));
    console.log(chalk_1.default.green(`Integration recipe has been successfully written to ${writePath}`));
});
exports.buildRecipe = buildRecipe;
/**
 * Build only integrations and previews
 * @param handoff
 */
const buildIntegrationOnly = (handoff) => __awaiter(void 0, void 0, void 0, function* () {
    const documentationObject = yield (0, exports.readPrevJSONFile)((0, exports.tokensFilePath)(handoff));
    if (documentationObject) {
        // Ensure that the integration object is set if possible
        // handoff.integrationObject = initIntegrationObject(handoff);
        yield buildIntegration(handoff, documentationObject);
        yield buildPreviews(handoff, documentationObject);
    }
});
exports.buildIntegrationOnly = buildIntegrationOnly;
/**
 * Run the entire pipeline
 */
const pipeline = (handoff, build) => __awaiter(void 0, void 0, void 0, function* () {
    if (!handoff.config) {
        throw new Error('Handoff config not found');
    }
    console.log(chalk_1.default.green(`Starting Handoff Figma data pipeline. Checking for environment and config.\n`));
    yield validateHandoffRequirements(handoff);
    yield validateFigmaAuth(handoff);
    const documentationObject = yield figmaExtract(handoff);
    yield buildCustomFonts(handoff, documentationObject);
    yield buildStyles(handoff, documentationObject);
    yield buildIntegration(handoff, documentationObject);
    yield buildPreviews(handoff, documentationObject);
    // await buildComponents(handoff);
    if (build) {
        yield (0, app_1.default)(handoff);
    }
    // (await pluginTransformer()).postBuild(documentationObject);
    console.log(chalk_1.default.green(`Figma pipeline complete:`, `${(0, api_2.getRequestCount)()} requests`));
});
exports.default = pipeline;
/**
 * Returns configured legacy component definitions in array form.
 * @deprecated Will be removed before 1.0.0 release.
 */
const getLegacyDefinitions = (handoff) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const sourcePath = path_1.default.resolve(handoff.workingPath, 'exportables');
        if (!fs_extra_1.default.existsSync(sourcePath)) {
            return null;
        }
        const definitionPaths = (0, fs_1.findFilesByExtension)(sourcePath, '.json');
        const exportables = definitionPaths
            .map((definitionPath) => {
            const defBuffer = fs_extra_1.default.readFileSync(definitionPath);
            const exportable = JSON.parse(defBuffer.toString());
            const exportableOptions = {};
            (0, lodash_1.merge)(exportableOptions, exportable.options);
            exportable.options = exportableOptions;
            return exportable;
        })
            .filter(utils_1.filterOutNull);
        return exportables ? exportables : null;
    }
    catch (e) {
        return [];
    }
});
