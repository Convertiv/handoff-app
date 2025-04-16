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
exports.zipTokens = exports.addFileToZip = exports.getIntegrationEntryPoint = exports.getPathToIntegration = void 0;
const archiver_1 = __importDefault(require("archiver"));
const chalk_1 = __importDefault(require("chalk"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const handlebars_1 = __importDefault(require("handlebars"));
const path_1 = __importDefault(require("path"));
const tokens_1 = require("../tokens");
const utils_1 = require("../utils");
/**
 * Derive the path to the integration.
 */
const getPathToIntegration = (handoff, resolveTemplatePath) => {
    var _a;
    if (!handoff) {
        throw Error('Handoff not initialized');
    }
    if (!handoff.force) {
        const integrationPath = path_1.default.resolve(path_1.default.join(handoff.workingPath, (_a = handoff.config.integrationPath) !== null && _a !== void 0 ? _a : 'integration'));
        if (fs_extra_1.default.existsSync(integrationPath)) {
            return integrationPath;
        }
    }
    if (resolveTemplatePath) {
        return path_1.default.resolve(path_1.default.join(handoff.modulePath, 'config', 'templates', 'integration'));
    }
    return null;
};
exports.getPathToIntegration = getPathToIntegration;
/**
 * Get the entry point for the integration
 * @returns string
 */
const getIntegrationEntryPoint = (handoff) => {
    var _a, _b;
    return (_b = (_a = handoff === null || handoff === void 0 ? void 0 : handoff.integrationObject) === null || _a === void 0 ? void 0 : _a.entries) === null || _b === void 0 ? void 0 : _b.bundle;
};
exports.getIntegrationEntryPoint = getIntegrationEntryPoint;
/**
 * A recusrive function for building a zip of the tokens
 * @param directory
 * @param dirPath
 * @param archive
 * @returns
 */
const addFileToZip = (directory, dirPath, archive) => __awaiter(void 0, void 0, void 0, function* () {
    for (const file of directory) {
        const pathFile = path_1.default.join(dirPath, file);
        if (fs_extra_1.default.lstatSync(pathFile).isDirectory()) {
            const recurse = yield fs_extra_1.default.readdir(pathFile);
            archive = yield (0, exports.addFileToZip)(recurse, pathFile, archive);
        }
        else {
            const data = fs_extra_1.default.readFileSync(pathFile, 'utf-8');
            archive.append(data, { name: pathFile });
        }
    }
    return archive;
});
exports.addFileToZip = addFileToZip;
/**
 * Zip the fonts for download
 * @param dirPath
 * @param destination
 * @returns
 */
const zipTokens = (dirPath, destination) => __awaiter(void 0, void 0, void 0, function* () {
    let archive = (0, archiver_1.default)('zip', {
        zlib: { level: 9 }, // Sets the compression level.
    });
    // good practice to catch this error explicitly
    archive.on('error', function (err) {
        throw err;
    });
    archive.pipe(destination);
    const directory = yield fs_extra_1.default.readdir(dirPath);
    archive = yield (0, exports.addFileToZip)(directory, dirPath, archive);
    yield archive.finalize();
    return destination;
});
exports.zipTokens = zipTokens;
const buildIntegration = (sourcePath, destPath, documentationObject, rootPath, rootReturnPath) => __awaiter(void 0, void 0, void 0, function* () {
    if ((yield fs_extra_1.default.stat(sourcePath)).isFile()) {
        sourcePath = path_1.default.dirname(sourcePath);
    }
    rootPath !== null && rootPath !== void 0 ? rootPath : (rootPath = sourcePath);
    const items = yield fs_extra_1.default.readdir(sourcePath);
    const components = Object.keys(documentationObject.components);
    for (const item of items) {
        const sourceItemPath = path_1.default.join(sourcePath, item);
        const destItemPath = path_1.default.join(destPath, item);
        const stat = yield fs_extra_1.default.stat(sourceItemPath);
        if (stat.isDirectory()) {
            // Create the directory in the destination path if it doesn't exist
            yield fs_extra_1.default.ensureDir(destItemPath);
            // Recursively process the directory
            yield buildIntegration(sourceItemPath, destItemPath, documentationObject, rootPath, (rootReturnPath !== null && rootReturnPath !== void 0 ? rootReturnPath : '../') + '../');
        }
        else {
            // Check if the file needs to be processed
            if (['scss', 'css', 'json'].includes(sourceItemPath.split('.').at(-1))) {
                // Read the file content and prepare for processing
                const content = yield loadTemplateContent(sourceItemPath);
                // Compile the template with Handlebars
                const template = handlebars_1.default.compile(content);
                // Render the content with Handlebars
                const renderedContent = template({
                    components: Object.keys(documentationObject.components),
                    documentationObject: documentationObject,
                });
                // Ensure the directory exists before writing the file
                yield fs_extra_1.default.ensureDir(path_1.default.dirname(destItemPath));
                // Write the rendered content to the destination path
                yield fs_extra_1.default.writeFile(destItemPath, replaceHandoffImportTokens(renderedContent, components, path_1.default.parse(destItemPath).dir, rootPath, rootReturnPath !== null && rootReturnPath !== void 0 ? rootReturnPath : '../'));
            }
            else {
                // Ensure the directory exists before writing the file
                yield fs_extra_1.default.ensureDir(path_1.default.dirname(destItemPath));
                // Copy file
                yield fs_extra_1.default.copyFile(sourceItemPath, destItemPath);
            }
        }
    }
});
/**
 * Asynchronously loads the content of a template file.
 *
 * @param {string} path - The path to the template file.
 * @returns {Promise<string>} - A promise that resolves to the content of the file.
 */
const loadTemplateContent = (path) => __awaiter(void 0, void 0, void 0, function* () {
    let content = yield fs_extra_1.default.readFile(path, 'utf-8');
    return content;
});
/**
 * Find the integration to sync and sync the sass files and template files.
 * @param documentationObject
 */
function integrationTransformer(handoff, documentationObject) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        if (!(handoff === null || handoff === void 0 ? void 0 : handoff.integrationObject)) {
            return;
        }
        console.log(chalk_1.default.green(`Integration build started...`));
        const outputFolder = path_1.default.resolve(handoff.modulePath, '.handoff', `${handoff.config.figma_project_id}`, 'public');
        if (!fs_extra_1.default.existsSync(outputFolder)) {
            yield fs_extra_1.default.promises.mkdir(outputFolder, { recursive: true });
        }
        const integrationPath = (0, exports.getPathToIntegration)(handoff, false);
        if (!integrationPath) {
            console.log(chalk_1.default.yellow('Unable to build integration. Reason: Unable to resolve integration path.'));
            return;
        }
        const destinationPath = path_1.default.resolve(handoff.workingPath, handoff.exportsDirectory, handoff.config.figma_project_id, 'integration');
        const integrationDataPath = (_b = (_a = handoff === null || handoff === void 0 ? void 0 : handoff.integrationObject) === null || _a === void 0 ? void 0 : _a.entries) === null || _b === void 0 ? void 0 : _b.integration;
        if (!integrationDataPath) {
            console.log(chalk_1.default.yellow('Unable to build integration. Reason: Integration entry not specified.'));
            return;
        }
        try {
            handlebars_1.default.registerHelper(`value`, (componentName, part, variant, property, options) => {
                const context = options.data.root;
                const component = context.documentationObject.components[componentName.toLocaleLowerCase()];
                if (!component) {
                    return new handlebars_1.default.SafeString('unset');
                }
                const search = variant.split(',').map((pair) => {
                    const [key, value] = pair.split(':');
                    return [key !== null && key !== void 0 ? key : ''.trim(), value !== null && value !== void 0 ? value : ''.trim()];
                });
                const componentInstance = component.instances.find((instance) => search.every(([searchProperty, searchValue]) => {
                    return instance.variantProperties.some((variantProperty) => variantProperty[0].toLocaleLowerCase() === searchProperty.toLocaleLowerCase() &&
                        variantProperty[1].toLocaleLowerCase() === searchValue.toLocaleLowerCase());
                }));
                if (!componentInstance) {
                    return new handlebars_1.default.SafeString('unset');
                }
                const partTokenSets = componentInstance.parts[''] || componentInstance.parts['$'];
                if (!partTokenSets || partTokenSets.length === 0) {
                    return new handlebars_1.default.SafeString('unset');
                }
                const tokens = partTokenSets.reduce((prev, curr) => (Object.assign(Object.assign({}, prev), (0, tokens_1.getTokenSetTokens)(curr))), {});
                if (!tokens) {
                    return new handlebars_1.default.SafeString('unset');
                }
                const value = tokens[property];
                if (!value) {
                    return new handlebars_1.default.SafeString('unset');
                }
                if (typeof value === 'string') {
                    return new handlebars_1.default.SafeString(value);
                }
                return new handlebars_1.default.SafeString(value[0]);
            });
            for (const tokenType of ['css', 'scss']) {
                handlebars_1.default.registerHelper(`${tokenType}-token`, (componentName, part, variant, property, options) => {
                    const context = options.data.root;
                    const component = context.documentationObject.components[componentName.toLocaleLowerCase()];
                    if (!component) {
                        return new handlebars_1.default.SafeString('unset');
                    }
                    const search = variant.split(',').map((pair) => {
                        const [key, value] = pair.split(':');
                        return [key !== null && key !== void 0 ? key : ''.trim(), value !== null && value !== void 0 ? value : ''.trim()];
                    });
                    const componentInstance = component.instances.find((instance) => search.every(([searchProperty, _]) => {
                        return instance.variantProperties.some((variantProperty) => variantProperty[0].toLocaleLowerCase() === searchProperty.toLocaleLowerCase());
                    }));
                    if (!componentInstance) {
                        return new handlebars_1.default.SafeString('unset');
                    }
                    return new handlebars_1.default.SafeString((0, utils_1.formatTokenName)(tokenType, componentName, search, part, property, handoff.integrationObject.options[componentName]));
                });
            }
            yield buildIntegration(integrationDataPath, destinationPath, documentationObject);
            console.log(chalk_1.default.green('Integration build finished successfully!'));
        }
        catch (err) {
            console.error(chalk_1.default.red(`Unable to build integration. Reason: Error was encountered (${err})`));
        }
        // prepare relevant export paths
        const exportPath = path_1.default.resolve(handoff.workingPath, handoff.exportsDirectory, handoff.config.figma_project_id);
        const exportIntegrationPath = path_1.default.resolve(handoff.workingPath, exportPath, `integration`);
        // copy the exported integration into the user defined dir (if the EXPORT_PATH environment variable is defined)
        if (process.env.HANDOFF_EXPORT_PATH) {
            fs_extra_1.default.copySync(exportIntegrationPath, process.env.HANDOFF_EXPORT_PATH);
        }
        // zip the tokens
        yield (0, exports.zipTokens)(exportPath, fs_extra_1.default.createWriteStream(path_1.default.join(outputFolder, `tokens.zip`)));
    });
}
exports.default = integrationTransformer;
const replaceHandoffImportTokens = (content, components, currentPath, rootPath, rootReturnPath) => {
    getHandoffImportTokens(components, currentPath, rootPath, rootReturnPath).forEach(([token, imports]) => {
        content = content.replaceAll(`//<#${token}#>`, imports.map((path) => `@import '${path}';`).join(`\r\n`));
    });
    return content;
};
const getHandoffImportTokens = (components, currentPath, rootPath, rootReturnPath) => {
    const result = [];
    components.forEach((component) => {
        getHandoffImportTokensForComponent(component, currentPath, rootPath, rootReturnPath).forEach(([importToken, ...searchPath], idx) => {
            var _a;
            (_a = result[idx]) !== null && _a !== void 0 ? _a : result.push([importToken, []]);
            if (fs_extra_1.default.existsSync(path_1.default.resolve(...searchPath))) {
                result[idx][1].push(`${searchPath[1]}/${component}`);
            }
        });
    });
    return result;
};
const getHandoffImportTokensForComponent = (component, currentPath, rootPath, rootReturnPath) => {
    const integrationPath = path_1.default.resolve(currentPath, rootReturnPath);
    return [
        ['HANDOFF.TOKENS.TYPES', currentPath, `${rootReturnPath}tokens/types`, `${component}.scss`],
        ['HANDOFF.TOKENS.SASS', currentPath, `${rootReturnPath}tokens/sass`, `${component}.scss`],
        ['HANDOFF.TOKENS.CSS', currentPath, `${rootReturnPath}tokens/css`, `${component}.css`],
        ['HANDOFF.MAPS', rootPath, 'maps', `_${component}.scss`],
        ['HANDOFF.EXTENSIONS', rootPath, 'extended', `_${component}.scss`],
    ];
};
