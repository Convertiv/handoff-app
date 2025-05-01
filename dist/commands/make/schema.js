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
const __1 = __importDefault(require("../../"));
const utils_1 = require("../utils");
const command = {
    command: 'make:schema <type> <name>',
    describe: 'Create a new exportable schema',
    builder: (yargs) => {
        return (0, utils_1.getSharedOptions)(yargs)
            .positional('type', {
            describe: '',
            type: 'string',
        })
            .positional('name', {
            describe: '',
            type: 'string',
        });
    },
    handler: (args) => __awaiter(void 0, void 0, void 0, function* () {
        const handoff = new __1.default(args.debug, args.force);
        const type = args.type;
        const name = args.name;
        if (!/^[a-z0-9]+$/i.test(name)) {
            console.error(`Exportable name must be alphanumeric and may contain dashes or underscores`);
            return;
        }
        yield handoff.makeExportable(type, name);
    }),
};
exports.default = command;
