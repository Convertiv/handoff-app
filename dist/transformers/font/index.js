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
exports.zipFonts = void 0;
const chalk_1 = __importDefault(require("chalk"));
const archiver_1 = __importDefault(require("archiver"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const sortedUniq_1 = __importDefault(require("lodash/sortedUniq"));
/**
 * Detect a font present in the public dir.  If it matches a font family from
 * figma, zip it up and make it avaliable in the config for use
 */
function fontTransformer(handoff, documentationObject) {
    return __awaiter(this, void 0, void 0, function* () {
        const { design } = documentationObject;
        const outputFolder = 'public';
        const fontLocation = path_1.default.join(handoff === null || handoff === void 0 ? void 0 : handoff.workingPath, 'fonts');
        const families = design.typography.reduce((result, current) => {
            return Object.assign(Object.assign({}, result), { [current.values.fontFamily]: result[current.values.fontFamily]
                    ? // sorts and returns unique font weights
                        (0, sortedUniq_1.default)([...result[current.values.fontFamily], current.values.fontWeight].sort((a, b) => a - b))
                    : [current.values.fontWeight] });
        }, {});
        const customFonts = [];
        Object.keys(families).map((key) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            //
            const name = key.replace(/\s/g, '');
            const fontDirName = path_1.default.join(fontLocation, name);
            if (fs_extra_1.default.existsSync(fontDirName)) {
                console.log(chalk_1.default.green(`Found a custom font ${name}`));
                // Ok, we've found a custom font at this location
                // Zip the font up and put the zip in the font location
                const stream = fs_extra_1.default.createWriteStream(path_1.default.join(fontLocation, `${name}.zip`));
                yield (0, exports.zipFonts)(fontDirName, stream);
                const fontsFolder = path_1.default.resolve(handoff.workingPath, handoff.exportsDirectory, handoff.config.figma_project_id, (_a = handoff.config.integrationPath) !== null && _a !== void 0 ? _a : 'integration', 'fonts');
                if (!fs_extra_1.default.existsSync(fontsFolder)) {
                    fs_extra_1.default.mkdirSync(fontsFolder);
                }
                yield fs_extra_1.default.copySync(fontDirName, fontsFolder);
                customFonts.push(`${name}.zip`);
            }
        }));
        //const hookReturn = (await pluginTransformer()).postFont(documentationObject, customFonts);
        //return hookReturn;
    });
}
exports.default = fontTransformer;
/**
 * Zip the fonts for download
 * @param dirPath
 * @param destination
 * @returns
 */
const zipFonts = (dirPath, destination) => __awaiter(void 0, void 0, void 0, function* () {
    const archive = (0, archiver_1.default)('zip', {
        zlib: { level: 9 }, // Sets the compression level.
    });
    // good practice to catch this error explicitly
    archive.on('error', function (err) {
        throw err;
    });
    archive.pipe(destination);
    const fontDir = yield fs_extra_1.default.readdir(dirPath);
    for (const file of fontDir) {
        const data = fs_extra_1.default.readFileSync(path_1.default.join(dirPath, file), 'utf-8');
        archive.append(data, { name: path_1.default.basename(file) });
    }
    yield archive.finalize();
    return destination;
});
exports.zipFonts = zipFonts;
