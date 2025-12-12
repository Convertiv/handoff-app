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
    command: 'validate:components',
    describe: 'Validate components in the design system',
    builder: (yargs) => {
        return (0, utils_1.getSharedOptions)(yargs)
            .option('skip-build', {
            describe: 'Skip build step before validating components',
            type: 'boolean',
            default: false,
        });
    },
    handler: (args) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const handoff = new __1.default(args.debug, args.force);
        yield handoff.validateComponents((_a = args.skipBuild) !== null && _a !== void 0 ? _a : false);
    }),
};
exports.default = command;
