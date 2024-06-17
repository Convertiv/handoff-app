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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.makePage = exports.makeTemplate = exports.makeExportable = void 0;
var path_1 = __importDefault(require("path"));
var fs_extra_1 = __importDefault(require("fs-extra"));
var chalk_1 = __importDefault(require("chalk"));
/**
 * Make a new exportable component
 * @param handoff
 */
var makeExportable = function (handoff, type, name) { return __awaiter(void 0, void 0, void 0, function () {
    var config, workingPath, targetDir, target, templatePath, template;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, handoff.config];
            case 1:
                config = _a.sent();
                if (type !== 'component' && type !== 'foundation') {
                    console.log(chalk_1.default.red("Exportable type must be either 'component' or 'foundation'"));
                    return [2 /*return*/];
                }
                if (!/^[a-z0-9]+$/i.test(name)) {
                    console.log(chalk_1.default.red("Exportable name must be alphanumeric and may contain dashes or underscores"));
                    return [2 /*return*/];
                }
                workingPath = path_1.default.resolve(path_1.default.join(handoff.workingPath, 'exportables'));
                if (!fs_extra_1.default.existsSync(workingPath)) {
                    fs_extra_1.default.mkdirSync(workingPath);
                }
                targetDir = path_1.default.resolve(workingPath, "".concat(type, "s"));
                if (!fs_extra_1.default.existsSync(targetDir)) {
                    fs_extra_1.default.mkdirSync(targetDir);
                }
                target = path_1.default.resolve(targetDir, "".concat(name, ".json"));
                if (fs_extra_1.default.existsSync(target)) {
                    if (!handoff.force) {
                        console.log(chalk_1.default.yellow("'".concat(name, "' already exists as an exportable.  Use the --force flag revert it to default.")));
                        return [2 /*return*/];
                    }
                }
                templatePath = path_1.default.resolve(path_1.default.join(handoff.modulePath, 'config/templates', 'exportable.json'));
                template = JSON.parse(fs_extra_1.default.readFileSync(templatePath, 'utf8'));
                template.id = name;
                template.group = type.slice(0, 1).toUpperCase() + type.slice(1, type.length) + 's';
                template.options.exporter.search = name.slice(0, 1).toUpperCase() + name.slice(1, type.length);
                template.options.transformer.cssRootClass = name;
                fs_extra_1.default.writeFileSync(target, "".concat(JSON.stringify(template, null, 2)));
                console.log(chalk_1.default.green("New exportable schema ".concat(name, ".json was created in ").concat(targetDir)));
                return [2 /*return*/, handoff];
        }
    });
}); };
exports.makeExportable = makeExportable;
/**
 * Make a new exportable component
 * @param handoff
 */
var makeTemplate = function (handoff, component, state) { return __awaiter(void 0, void 0, void 0, function () {
    var config, workingPath, target, templatePath, template;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, handoff.config];
            case 1:
                config = _a.sent();
                if (!component) {
                    console.log(chalk_1.default.red("Template component must be set"));
                    return [2 /*return*/];
                }
                if (!state) {
                    state = 'default';
                }
                if (!/^[a-z0-9]+$/i.test(component)) {
                    console.log(chalk_1.default.red("Template component must be alphanumeric and may contain dashes or underscores"));
                    return [2 /*return*/];
                }
                if (!/^[a-z0-9]+$/i.test(state)) {
                    console.log(chalk_1.default.red("Template state must be alphanumeric and may contain dashes or underscores"));
                    return [2 /*return*/];
                }
                workingPath = path_1.default.resolve(path_1.default.join(handoff.workingPath, "integration/templates/".concat(component)));
                if (!fs_extra_1.default.existsSync(workingPath)) {
                    fs_extra_1.default.mkdirSync(workingPath, { recursive: true });
                }
                target = path_1.default.resolve(workingPath, "".concat(state, ".html"));
                if (fs_extra_1.default.existsSync(target)) {
                    if (!handoff.force) {
                        console.log(chalk_1.default.yellow("'".concat(state, "' already exists as custom template.  Use the --force flag revert it to default.")));
                        return [2 /*return*/];
                    }
                }
                templatePath = path_1.default.resolve(path_1.default.join(handoff.modulePath, 'config/templates', 'template.html'));
                template = fs_extra_1.default.readFileSync(templatePath, 'utf8');
                fs_extra_1.default.writeFileSync(target, template);
                console.log(chalk_1.default.green("New template ".concat(state, ".html was created in ").concat(workingPath)));
                return [2 /*return*/, handoff];
        }
    });
}); };
exports.makeTemplate = makeTemplate;
/**
 * Make a new docs page
 * @param handoff
 */
var makePage = function (handoff, name, parent) { return __awaiter(void 0, void 0, void 0, function () {
    var config, workingPath, sourcePath, templatePath, target, template;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, handoff.config];
            case 1:
                config = _a.sent();
                if (!name) {
                    console.log(chalk_1.default.red("Page name must be set"));
                    return [2 /*return*/];
                }
                if (!/^[a-z0-9]+$/i.test(name)) {
                    console.log(chalk_1.default.red("Page name must be alphanumeric and may contain dashes or underscores"));
                    return [2 /*return*/];
                }
                if (parent) {
                    if (!/^[a-z0-9]+$/i.test(parent)) {
                        console.log(chalk_1.default.red("Parent name must be alphanumeric and may contain dashes or underscores"));
                        return [2 /*return*/];
                    }
                    workingPath = path_1.default.resolve(path_1.default.join(handoff.workingPath, "docs", parent));
                    sourcePath = path_1.default.resolve(path_1.default.join(handoff.modulePath, "config/docs", parent, "".concat(name, ".md")));
                }
                else {
                    workingPath = path_1.default.resolve(path_1.default.join(handoff.workingPath, "docs"));
                    sourcePath = path_1.default.resolve(path_1.default.join(handoff.modulePath, "config/docs", "".concat(name, ".md")));
                }
                if (!fs_extra_1.default.existsSync(workingPath)) {
                    fs_extra_1.default.mkdirSync(workingPath, { recursive: true });
                }
                target = path_1.default.resolve(workingPath, "".concat(name, ".md"));
                if (fs_extra_1.default.existsSync(target)) {
                    if (!handoff.force) {
                        console.log(chalk_1.default.yellow("'".concat(name, "' already exists as custom page.  Use the --force flag revert it to default.")));
                        return [2 /*return*/];
                    }
                }
                templatePath = path_1.default.resolve(path_1.default.join(handoff.modulePath, 'config/templates', 'page.md'));
                if (fs_extra_1.default.existsSync(sourcePath)) {
                    templatePath = sourcePath;
                }
                template = fs_extra_1.default.readFileSync(templatePath, 'utf8');
                fs_extra_1.default.writeFileSync(target, template);
                console.log(chalk_1.default.green("New template ".concat(name, ".md was created in ").concat(workingPath)));
                return [2 /*return*/, handoff];
        }
    });
}); };
exports.makePage = makePage;
