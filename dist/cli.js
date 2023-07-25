#! /usr/bin/env node
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
        while (_) try {
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
var arg_1 = __importDefault(require("arg"));
var _1 = __importDefault(require("."));
var HandoffCliError = /** @class */ (function (_super) {
    __extends(HandoffCliError, _super);
    function HandoffCliError(message) {
        var _this = 
        // 'Error' breaks prototype chain here
        _super.call(this, message) || this;
        _this.exitCode = 1;
        _this.messageOnly = false;
        return _this;
    }
    return HandoffCliError;
}(Error));
var usage = "Usage: handoff-app <cmd> <opts>\n\nCommands:\n  fetch [opts] - Fetches the design tokens from the design system\n\n  build - Using the current tokens, build various outputs\n    build:app [opts] - Builds the design system static application\n    build:integration [opts] - Builds current selected integration, styles and previews\n\n  start [opts] - Starts the design system in development mode\n\n  make\n    make:exportable <type> <name> [opts] - Creates a new schema\n    make:template <component> <state> [opts] - Creates a new template\n    make:page <component> <state> [opts] - Creates a new page\n\n  eject - Ejects the default entire configuration to the current directory\n    eject:config [opts] - Ejects the default configuration to the current directory\n    eject:integration [opts] - Ejects the default integration to the current directory\n    eject:exportables [opts] - Ejects the default exportables to the current directory\n    eject:pages [opts] - Ejects the default pages to the current directory\n\nOptions:\n  -c, --config [file]      Define the path to the config file\n  -d, --debug              Show debug logs\n  -h, --help               Show this help message\n  -v, --version            Show the version number\n";
/**
 * Show the help message
 */
var showHelp = function () {
    cliError(usage, 2);
};
/**
 * Show the help message
 */
var showVersion = function () {
    cliError('Handoff App - 0.7.1-dev', 2);
};
/**
 * Define a CLI error
 * @param msg
 * @param exitCode
 */
var cliError = function (msg, exitCode) {
    if (exitCode === void 0) { exitCode = 1; }
    var err = new HandoffCliError(msg);
    err.messageOnly = true;
    err.exitCode = exitCode;
    throw err;
};
var watching = false;
var run = function (argv, stdout, stderr) { return __awaiter(void 0, void 0, void 0, function () {
    var args, handoff_1, _a, type, name_1, templateComponent, templateState, e_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 16, , 17]);
                args = (0, arg_1.default)({
                    '--help': Boolean,
                    '-h': '--help',
                    '--version': Boolean,
                    '-v': '--version',
                    '--config': String,
                    '-c': '--config',
                    '--debug': Boolean,
                    '-d': '--debug',
                    '--force': Boolean,
                    '-f': '--force',
                }, {
                    permissive: false,
                    argv: argv,
                });
                if (args['--help']) {
                    return [2 /*return*/, showHelp()];
                }
                if (args['--version']) {
                    return [2 /*return*/, showVersion()];
                }
                handoff_1 = new _1.default();
                if (args['--debug']) {
                    handoff_1.debug = true;
                }
                if (args['--force']) {
                    handoff_1.force = true;
                }
                _a = args._[0];
                switch (_a) {
                    case 'fetch': return [3 /*break*/, 1];
                    case 'build:app': return [3 /*break*/, 2];
                    case 'start': return [3 /*break*/, 4];
                    case 'dev': return [3 /*break*/, 5];
                    case 'build:integration': return [3 /*break*/, 6];
                    case 'eject': return [3 /*break*/, 7];
                    case 'eject:config': return [3 /*break*/, 8];
                    case 'eject:integration': return [3 /*break*/, 9];
                    case 'eject:exportables': return [3 /*break*/, 10];
                    case 'eject:pages': return [3 /*break*/, 11];
                    case 'make:exportable': return [3 /*break*/, 12];
                    case 'make:template': return [3 /*break*/, 13];
                }
                return [3 /*break*/, 14];
            case 1: return [2 /*return*/, handoff_1.fetch()];
            case 2: return [4 /*yield*/, handoff_1.build()];
            case 3:
                _b.sent();
                return [2 /*return*/, handoff_1];
            case 4:
                watching = true;
                return [2 /*return*/, handoff_1.start()];
            case 5:
                watching = true;
                return [2 /*return*/, handoff_1.dev()];
            case 6: return [2 /*return*/, handoff_1.integration()];
            case 7:
                cliError("Eject commands will eject the default configuration into the working directory so you can customize it.\n\nEject must have a subcommand. Did you mean:\n  - eject:config\n  - eject:exportables.\n  - eject:integration\n  - eject:docs.", 2);
                _b.label = 8;
            case 8: return [2 /*return*/, handoff_1.ejectConfig()];
            case 9: return [2 /*return*/, handoff_1.ejectIntegration()];
            case 10: return [2 /*return*/, handoff_1.ejectExportables()];
            case 11: return [2 /*return*/, handoff_1.ejectPages()];
            case 12:
                type = args._[1];
                if (!type) {
                    cliError("You must specify a type of 'component' or 'foundation'", 2);
                }
                name_1 = args._[2];
                if (!name_1) {
                    cliError("You must specify a name for the exportable", 2);
                }
                if (!/^[a-z0-9]+$/i.test(name_1)) {
                    cliError("Exportable name must be alphanumeric and may contain dashes or underscores", 2);
                }
                return [2 /*return*/, handoff_1.makeExportable(type, name_1)];
            case 13:
                templateComponent = args._[1];
                if (!templateComponent) {
                    cliError("You must supply a component name", 2);
                }
                if (!/^[a-z0-9]+$/i.test(templateComponent)) {
                    cliError("Template component must be alphanumeric and may contain dashes or underscores", 2);
                }
                templateState = args._[2];
                if (templateState && !/^[a-z0-9]+$/i.test(templateComponent)) {
                    cliError("Template state must be alphanumeric and may contain dashes or underscores", 2);
                }
                return [2 /*return*/, handoff_1.makeTemplate(templateComponent, templateState)];
            case 14: return [2 /*return*/, showHelp()];
            case 15: return [3 /*break*/, 17];
            case 16:
                e_1 = _b.sent();
                if (e_1.message.indexOf('Unknown or unexpected option') === -1)
                    throw e_1;
                return [2 /*return*/, cliError(e_1.message + "\n".concat(usage), 2)];
            case 17: return [2 /*return*/];
        }
    });
}); };
run(process.argv.slice(2), process.stdout, process.stderr)
    .then(function () {
    if (!watching) {
        process.exit(0);
    }
})
    .catch(function (e) {
    if (!e.silent)
        console.error(e.messageOnly ? e.message : e);
    process.exit(e.exitCode || 1);
});
