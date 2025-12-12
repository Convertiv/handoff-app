"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSharedOptions = void 0;
const getSharedOptions = (yargs) => {
    return yargs.options({
        config: {
            alias: 'c',
            type: 'string',
            description: 'Path to config file',
        },
        force: {
            alias: 'f',
            type: 'boolean',
            description: 'Force action',
        },
        debug: {
            alias: 'd',
            type: 'boolean',
            description: 'Enable debug mode',
        },
    });
};
exports.getSharedOptions = getSharedOptions;
