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
const utils_1 = require("../utils");
const __1 = __importDefault(require("../../"));
const command = {
    command: 'rename:component <source> <destination>',
    describe: 'Rename a component from source to destination and update all references',
    builder: (yargs) => {
        return (0, utils_1.getSharedOptions)(yargs)
            .positional('source', {
            describe: 'Source component name',
            type: 'string',
        })
            .positional('destination', {
            describe: 'Destination component name',
            type: 'string',
        });
    },
    handler: (args) => __awaiter(void 0, void 0, void 0, function* () {
        const handoff = new __1.default(args.debug, args.force, { integrationPath: args.integration });
        yield handoff.renameComponent(args.source, args.destination);
    }),
};
exports.default = command;
