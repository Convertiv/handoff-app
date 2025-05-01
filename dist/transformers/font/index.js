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
const archiver_1 = __importDefault(require("archiver"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const sortedUniq_1 = __importDefault(require("lodash/sortedUniq"));
const path_1 = __importDefault(require("path"));
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
/**
 * Detect a font present in the public dir.  If it matches a font family from
 * figma, zip it up and make it avaliable in the config for use
 */
function fontTransformer(handoff, documentationObject) {
    return __awaiter(this, void 0, void 0, function* () {
        const { design } = documentationObject;
        const fontLocation = path_1.default.join(handoff === null || handoff === void 0 ? void 0 : handoff.workingPath, 'fonts');
        const families = design.typography.reduce((result, current) => {
            return Object.assign(Object.assign({}, result), { [current.values.fontFamily]: result[current.values.fontFamily]
                    ? // sorts and returns unique font weights
                        (0, sortedUniq_1.default)([...result[current.values.fontFamily], current.values.fontWeight].sort((a, b) => a - b))
                    : [current.values.fontWeight] });
        }, {});
        Object.keys(families).map((key) => __awaiter(this, void 0, void 0, function* () {
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
}
exports.default = fontTransformer;
