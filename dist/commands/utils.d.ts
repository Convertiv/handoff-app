import { Argv } from 'yargs';
export declare const getSharedOptions: (yargs: Argv) => Argv<import("yargs").Omit<{}, "integration" | "config" | "force" | "debug"> & import("yargs").InferredOptionTypes<{
    config: {
        alias: string;
        type: "string";
        description: string;
    };
    integration: {
        alias: string;
        type: "string";
        description: string;
    };
    force: {
        alias: string;
        type: "boolean";
        description: string;
    };
    debug: {
        alias: string;
        type: "boolean";
        description: string;
    };
}>>;
