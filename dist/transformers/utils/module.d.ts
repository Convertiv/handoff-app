import { ModuleEvaluationResult } from '../types';
/**
 * Builds and evaluates a module using esbuild
 * @param entryPath - Path to the module entry point
 * @param handoff - Handoff instance for configuration
 * @returns Module evaluation result with exports
 */
export declare function buildAndEvaluateModule(entryPath: string, handoff: any): Promise<ModuleEvaluationResult>;
