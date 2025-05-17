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
exports.buildComponents = exports.zipAssets = exports.readPrevJSONFile = void 0;
const archiver_1 = __importDefault(require("archiver"));
const chalk_1 = __importDefault(require("chalk"));
require("dotenv/config");
const fs_extra_1 = __importDefault(require("fs-extra"));
const handoff_core_1 = require("handoff-core");
const lodash_1 = require("lodash");
const stream = __importStar(require("node:stream"));
const path_1 = __importDefault(require("path"));
const app_1 = __importDefault(require("./app"));
const changelog_1 = __importDefault(require("./changelog"));
const documentation_object_1 = require("./documentation-object");
const component_1 = require("./transformers/preview/component");
const prompt_1 = require("./utils/prompt");
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
 * Zips the contents of a directory and writes the resulting archive to a writable stream.
 *
 * @param dirPath - The path to the directory whose contents will be zipped.
 * @param destination - A writable stream where the zip archive will be written.
 * @returns A Promise that resolves with the destination stream when the archive has been finalized.
 * @throws Will throw an error if the archiving process fails.
 */
const zip = (dirPath, destination) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve, reject) => {
        const archive = (0, archiver_1.default)('zip', {
            zlib: { level: 9 },
        });
        // Set up event handlers
        archive.on('error', reject);
        destination.on('error', reject);
        // When the destination closes, resolve the promise
        destination.on('close', () => resolve(destination));
        archive.pipe(destination);
        fs_extra_1.default.readdir(dirPath)
            .then((fontDir) => {
            for (const file of fontDir) {
                const filePath = path_1.default.join(dirPath, file);
                archive.append(fs_extra_1.default.createReadStream(filePath), { name: path_1.default.basename(file) });
            }
            return archive.finalize();
        })
            .catch(reject);
    });
});
const zipAssets = (assets, destination) => __awaiter(void 0, void 0, void 0, function* () {
    const archive = (0, archiver_1.default)('zip', {
        zlib: { level: 9 }, // Sets the compression level.
    });
    // good practice to catch this error explicitly
    archive.on('error', function (err) {
        throw err;
    });
    archive.pipe(destination);
    assets.forEach((asset) => {
        archive.append(asset.data, { name: asset.path });
    });
    yield archive.finalize();
    return destination;
});
exports.zipAssets = zipAssets;
/**
 * Build just the custom fonts
 * @param documentationObject
 * @returns
 */
const buildCustomFonts = (handoff, documentationObject) => __awaiter(void 0, void 0, void 0, function* () {
    const { localStyles } = documentationObject;
    const fontLocation = path_1.default.join(handoff === null || handoff === void 0 ? void 0 : handoff.workingPath, 'fonts');
    const families = localStyles.typography.reduce((result, current) => {
        return Object.assign(Object.assign({}, result), { [current.values.fontFamily]: result[current.values.fontFamily]
                ? // sorts and returns unique font weights
                    (0, lodash_1.sortedUniq)([...result[current.values.fontFamily], current.values.fontWeight].sort((a, b) => a - b))
                : [current.values.fontWeight] });
    }, {});
    Object.keys(families).map((key) => __awaiter(void 0, void 0, void 0, function* () {
        const name = key.replace(/\s/g, '');
        const fontDirName = path_1.default.join(fontLocation, name);
        if (fs_extra_1.default.existsSync(fontDirName)) {
            const stream = fs_extra_1.default.createWriteStream(path_1.default.join(fontLocation, `${name}.zip`));
            yield zip(fontDirName, stream);
            const fontsFolder = path_1.default.resolve(handoff.workingPath, handoff.exportsDirectory, handoff.config.figma_project_id, 'fonts');
            if (!fs_extra_1.default.existsSync(fontsFolder)) {
                fs_extra_1.default.mkdirSync(fontsFolder);
            }
            fs_extra_1.default.copySync(fontDirName, fontsFolder);
        }
    }));
});
/**
 * Build previews
 * @param documentationObject
 * @returns
 */
const buildComponents = (handoff) => __awaiter(void 0, void 0, void 0, function* () {
    yield Promise.all([(0, component_1.componentTransformer)(handoff)]);
});
exports.buildComponents = buildComponents;
/**
 * Build only the styles pipeline
 * @param documentationObject
 */
const buildStyles = (handoff, documentationObject) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    // Core transformers that should always be included
    const coreTransformers = [
        {
            transformer: handoff_core_1.Transformers.ScssTransformer,
            outDir: 'sass',
            format: 'scss',
        },
        {
            transformer: handoff_core_1.Transformers.ScssTypesTransformer,
            outDir: 'types',
            format: 'scss',
        },
        {
            transformer: handoff_core_1.Transformers.CssTransformer,
            outDir: 'css',
            format: 'css',
        },
    ];
    // Get user-configured transformers
    const userTransformers = ((_b = (_a = handoff.config) === null || _a === void 0 ? void 0 : _a.pipeline) === null || _b === void 0 ? void 0 : _b.transformers) || [];
    // Merge core transformers with user transformers
    // If a user transformer matches a core transformer, use user's outDir and format
    const transformers = coreTransformers.map((coreTransformer) => {
        const userTransformer = userTransformers.find((t) => t.transformer === coreTransformer.transformer);
        return userTransformer ? Object.assign(Object.assign({}, coreTransformer), { outDir: userTransformer.outDir, format: userTransformer.format }) : coreTransformer;
    });
    // Add any additional user transformers that aren't core transformers
    userTransformers.forEach((userTransformer) => {
        if (!coreTransformers.some((core) => core.transformer === userTransformer.transformer)) {
            transformers.push(userTransformer);
        }
    });
    const baseDir = handoff.getVariablesFilePath();
    const runner = yield handoff.getRunner();
    // Create transformer instances and transform documentation object
    const transformedFiles = transformers.map(({ transformer }) => {
        var _a;
        return ({
            transformer,
            files: runner.transform(transformer({ useVariables: (_a = handoff.config) === null || _a === void 0 ? void 0 : _a.useVariables }), documentationObject),
        });
    });
    // Ensure base directory exists
    yield fs_extra_1.default.ensureDir(baseDir);
    // Create all necessary subdirectories
    const directories = transformers.map(({ outDir }) => path_1.default.join(baseDir, outDir));
    yield Promise.all(directories.map((dir) => fs_extra_1.default.ensureDir(dir)));
    // Special case for SD tokens components directory
    const sdTransformer = transformers.find((t) => t.transformer === handoff_core_1.Transformers.StyleDictionaryTransformer);
    if (sdTransformer) {
        const sdFiles = (_c = transformedFiles.find((t) => t.transformer === handoff_core_1.Transformers.StyleDictionaryTransformer)) === null || _c === void 0 ? void 0 : _c.files;
        if (sdFiles === null || sdFiles === void 0 ? void 0 : sdFiles.components) {
            yield Promise.all(Object.keys(sdFiles.components).map((name) => fs_extra_1.default.ensureDir(path_1.default.join(baseDir, sdTransformer.outDir, name))));
        }
    }
    // Write all files
    const writePromises = transformedFiles.flatMap(({ transformer: TransformerClass, files }) => {
        const { outDir, format } = transformers.find((t) => t.transformer === TransformerClass) || {};
        if (!outDir || !files)
            return [];
        const componentPromises = Object.entries(files.components || {}).map(([name, content]) => {
            const filePath = TransformerClass === handoff_core_1.Transformers.StyleDictionaryTransformer
                ? path_1.default.join(baseDir, outDir, name, `${name}.tokens.json`)
                : path_1.default.join(baseDir, outDir, `${name}.${format}`);
            return fs_extra_1.default.writeFile(filePath, content);
        });
        const designPromises = Object.entries(files.design || {}).map(([name, content]) => {
            const filePath = TransformerClass === handoff_core_1.Transformers.StyleDictionaryTransformer
                ? path_1.default.join(baseDir, outDir, `${name}.tokens.json`)
                : path_1.default.join(baseDir, outDir, `${name}.${format}`);
            return fs_extra_1.default.writeFile(filePath, content);
        });
        return [...componentPromises, ...designPromises];
    });
    // Generate tokens-map.json
    const mapFiles = (_d = transformedFiles.find((t) => t.transformer === handoff_core_1.Transformers.MapTransformer)) === null || _d === void 0 ? void 0 : _d.files;
    if (mapFiles) {
        const tokensMapContent = JSON.stringify(Object.entries(mapFiles.components || {}).reduce((acc, [_, data]) => (Object.assign(Object.assign({}, acc), JSON.parse(data))), Object.assign(Object.assign(Object.assign({}, JSON.parse(mapFiles.design.colors)), JSON.parse(mapFiles.design.typography)), JSON.parse(mapFiles.design.effects))), null, 2);
        writePromises.push(fs_extra_1.default.writeFile(path_1.default.join(handoff.getOutputPath(), 'tokens-map.json'), tokensMapContent));
    }
    // Write all files
    yield Promise.all(writePromises);
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
    let prevDocumentationObject = yield handoff.getDocumentationObject();
    let changelog = (yield (0, exports.readPrevJSONFile)(handoff.getChangelogFilePath())) || [];
    yield fs_extra_1.default.emptyDir(handoff.getOutputPath());
    const documentationObject = yield (0, documentation_object_1.createDocumentationObject)(handoff);
    const changelogRecord = (0, changelog_1.default)(prevDocumentationObject, documentationObject);
    if (changelogRecord) {
        changelog = [changelogRecord, ...changelog];
    }
    yield Promise.all([
        fs_extra_1.default.writeJSON(handoff.getTokensFilePath(), documentationObject, { spaces: 2 }),
        fs_extra_1.default.writeJSON(handoff.getChangelogFilePath(), changelog, { spaces: 2 }),
        ...(!process.env.HANDOFF_CREATE_ASSETS_ZIP_FILES || process.env.HANDOFF_CREATE_ASSETS_ZIP_FILES !== 'false'
            ? [
                (0, exports.zipAssets)(documentationObject.assets.icons, fs_extra_1.default.createWriteStream(handoff.getIconsZipFilePath())).then((writeStream) => stream.promises.finished(writeStream)),
                (0, exports.zipAssets)(documentationObject.assets.logos, fs_extra_1.default.createWriteStream(handoff.getLogosZipFilePath())).then((writeStream) => stream.promises.finished(writeStream)),
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
    fs_extra_1.default.copyFileSync(handoff.getIconsZipFilePath(), path_1.default.join(handoff.modulePath, '.handoff', `${handoff.config.figma_project_id}`, 'public', 'icons.zip'));
    fs_extra_1.default.copyFileSync(handoff.getLogosZipFilePath(), path_1.default.join(handoff.modulePath, '.handoff', `${handoff.config.figma_project_id}`, 'public', 'logos.zip'));
    return documentationObject;
});
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
    // await buildComponents(handoff);
    if (build) {
        yield (0, app_1.default)(handoff);
    }
});
exports.default = pipeline;
