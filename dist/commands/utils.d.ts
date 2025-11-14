import { Argv } from 'yargs';
export declare const getSharedOptions: (yargs: Argv) => Argv<import("yargs").Omit<{}, "force" | "debug" | "config"> & import("yargs").InferredOptionTypes<{
    config: {
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
