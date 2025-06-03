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
exports.renameComponent = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
/**
 * A utility function to rename a component
 * @param handoff
 * @param source
 * @param destination
 */
function renameComponent(handoff, source, destination) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        source = path_1.default.resolve(handoff.workingPath, (_a = handoff.config.integrationPath) !== null && _a !== void 0 ? _a : 'integration', 'components', source);
        destination = path_1.default.resolve(handoff.workingPath, (_b = handoff.config.integrationPath) !== null && _b !== void 0 ? _b : 'integration', 'components', destination);
        ['hbs', 'js', 'scss', 'css'].forEach((ext) => __awaiter(this, void 0, void 0, function* () {
            console.log(`Checking for ${source}.${ext}`);
            let test = source.includes(`.${ext}`) ? source : `${source}.${ext}`;
            if (fs_extra_1.default.existsSync(test)) {
                yield fs_extra_1.default.rename(test, destination.includes(`.${ext}`) ? destination : `${destination}.${ext}`);
            }
        }));
    });
}
exports.renameComponent = renameComponent;
