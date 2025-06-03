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
const chalk_1 = __importDefault(require("chalk"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const types_1 = require("../types");
const parseComponentJson = (id, location, data) => __awaiter(void 0, void 0, void 0, function* () {
    // Is there a JSON file with the same name?
    const jsonFile = id + '.json';
    const jsonPath = path_1.default.resolve(location, jsonFile);
    let parsed = {};
    if (fs_extra_1.default.existsSync(jsonPath)) {
        const json = yield fs_extra_1.default.readFile(jsonPath, 'utf8');
        if (json) {
            try {
                parsed = JSON.parse(json);
                // The JSON file defines each of the fields
                if (parsed) {
                    data.title = parsed.title;
                    data.image = parsed.image;
                    data.should_do = parsed.should_do || [];
                    data.should_not_do = parsed.should_not_do || [];
                    data.type = parsed.type || types_1.ComponentType.Element;
                    data.group = parsed.group || 'default';
                    data.tags = parsed.tags || [];
                    data.categories = parsed.categories || [];
                    data.figma = parsed.figma || '';
                    data.description = parsed.description;
                    data.properties = parsed.properties;
                    data.previews = parsed.previews;
                    data.preview_options = parsed.preview_options;
                }
            }
            catch (e) {
                console.log(chalk_1.default.red(`Error parsing JSON for ${id}`));
                console.log(e);
            }
        }
    }
    else {
        console.log(chalk_1.default.red(`No JSON file found for ${id}`));
    }
    return data;
});
exports.default = parseComponentJson;
