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
exports.getLatestVersionForComponent = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const semver_1 = __importDefault(require("semver"));
const component_1 = require("../component");
const getVersionsForComponent = (handoff, id) => __awaiter(void 0, void 0, void 0, function* () {
    const componentPath = path_1.default.resolve((0, component_1.getComponentPath)(handoff), id);
    const versionDirectories = fs_1.default.readdirSync(componentPath);
    const versions = [];
    // The directory name must be a semver
    if (fs_1.default.lstatSync(componentPath).isDirectory()) {
        // this is a directory structure.  this should be the component name,
        // and each directory inside should be a version
        for (const versionDirectory of versionDirectories) {
            if (semver_1.default.valid(versionDirectory)) {
                const versionFiles = fs_1.default.readdirSync(path_1.default.resolve(componentPath, versionDirectory));
                for (const versionFile of versionFiles) {
                    if (versionFile.endsWith('.hbs')) {
                        versions.push(versionDirectory);
                        break;
                    }
                }
            }
            else {
                console.error(`Invalid version directory ${versionDirectory}`);
            }
        }
    }
    versions.sort(semver_1.default.rcompare);
    return versions;
});
const getLatestVersionForComponent = (versions) => versions.sort(semver_1.default.rcompare)[0];
exports.getLatestVersionForComponent = getLatestVersionForComponent;
exports.default = getVersionsForComponent;
