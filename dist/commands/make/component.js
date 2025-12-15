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
const __1 = __importDefault(require("../.."));
const logger_1 = require("../../utils/logger");
const utils_1 = require("../utils");
const command = {
    command: 'make:component <name>',
    describe: 'Create a new html code component that you can embed in your documentation',
    builder: (yargs) => {
        return (0, utils_1.getSharedOptions)(yargs).positional('name', {
            describe: 'The name of the new component you are creating',
            type: 'string',
        });
    },
    handler: (args) => __awaiter(void 0, void 0, void 0, function* () {
        const handoff = new __1.default(args.debug, args.force);
        const componentName = args.name;
        if (!/^[a-z0-9_-]+$/i.test(componentName)) {
            logger_1.Logger.error(`Component name must be alphanumeric and may contain dashes or underscores`);
            return;
        }
        yield handoff.makeComponent(componentName);
    }),
};
exports.default = command;
