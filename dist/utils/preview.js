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
import webpack from 'webpack';
import path from 'path';
import chalk from 'chalk';
import { getIntegrationEntryPoint } from '../transformers/integration/index';
export var buildClientFiles = function () { return __awaiter(void 0, void 0, void 0, function () {
    var entry, handoff;
    return __generator(this, function (_a) {
        entry = getIntegrationEntryPoint();
        handoff = global.handoff;
        if (!handoff) {
            throw Error('Handoff not initialized');
        }
        return [2 /*return*/, new Promise(function (resolve, reject) {
                var config = {
                    mode: 'production',
                    entry: entry,
                    resolve: {
                        modules: [
                            path.resolve(handoff === null || handoff === void 0 ? void 0 : handoff.modulePath, 'src'),
                            path.resolve(handoff === null || handoff === void 0 ? void 0 : handoff.modulePath, 'node_modules'),
                            path.resolve(handoff === null || handoff === void 0 ? void 0 : handoff.workingPath, 'node_modules'),
                        ],
                    },
                    output: {
                        path: path.resolve(handoff === null || handoff === void 0 ? void 0 : handoff.modulePath, 'public/components'),
                        filename: 'bundle.js',
                    },
                    resolveLoader: {
                        modules: [path.resolve(handoff === null || handoff === void 0 ? void 0 : handoff.modulePath, 'node_modules'), path.resolve(handoff === null || handoff === void 0 ? void 0 : handoff.workingPath, 'node_modules')],
                    },
                    module: {
                        rules: [
                            {
                                test: /\.s[ac]ss$/i,
                                use: [
                                    // Creates `style` nodes from JS strings
                                    'style-loader',
                                    // Translates CSS into CommonJS
                                    'css-loader',
                                    // Compiles Sass to CSS
                                    'sass-loader',
                                ],
                            },
                        ],
                    },
                };
                var newConfig = handoff.hooks.webpack(config);
                var compile = webpack(newConfig);
                compile.run(function (err, stats) {
                    var _a, _b;
                    if (err) {
                        var error = 'Errors encountered trying to build preview styles1.\n';
                        if (process.argv.indexOf('--debug') > 0) {
                            error += err.stack || err;
                        }
                        return reject(error);
                    }
                    if (stats) {
                        if (stats.hasErrors()) {
                            var buildErrors = (_a = stats.compilation.errors) === null || _a === void 0 ? void 0 : _a.map(function (err) { return err.message; });
                            var error = 'Errors encountered trying to build preview styles2.\n';
                            if (process.argv.indexOf('--debug') > 0) {
                                error += buildErrors;
                            }
                            return reject(error);
                        }
                        if (stats.hasWarnings()) {
                            var buildWarnings = (_b = stats.compilation.warnings) === null || _b === void 0 ? void 0 : _b.map(function (err) { return err.message; });
                            var error = 'Warnings encountered when building preview styles.\n';
                            if (process.argv.indexOf('--debug') > 0) {
                                error += buildWarnings;
                                console.error(chalk.yellow(error));
                            }
                        }
                    }
                    return resolve('Preview template styles built');
                });
            })];
    });
}); };
