"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSharedOptions = void 0;
var getSharedOptions = function (yargs) {
    return yargs.options({
        config: {
            alias: 'c',
            type: 'string',
            description: 'Path to config file',
        },
        integration: {
            alias: 'i',
            type: 'string',
            description: 'Path to integration',
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
