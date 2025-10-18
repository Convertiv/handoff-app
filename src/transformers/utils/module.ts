import esbuild from 'esbuild';
import { ModuleEvaluationResult } from '../types';
import { DEFAULT_SSR_BUILD_CONFIG } from './build';

/**
 * Builds and evaluates a module using esbuild
 * @param entryPath - Path to the module entry point
 * @param handoff - Handoff instance for configuration
 * @returns Module evaluation result with exports
 */
export async function buildAndEvaluateModule(
  entryPath: string, 
  handoff: any
): Promise<ModuleEvaluationResult> {
  // Default esbuild configuration
  const defaultBuildConfig: esbuild.BuildOptions = {
    ...DEFAULT_SSR_BUILD_CONFIG,
    entryPoints: [entryPath],
  };

  // Apply user's SSR build config hook if provided
  const buildConfig = handoff.config?.hooks?.ssrBuildConfig
    ? handoff.config.hooks.ssrBuildConfig(defaultBuildConfig)
    : defaultBuildConfig;

  // Compile the module
  const build = await esbuild.build(buildConfig);
  const { text: code } = build.outputFiles[0];

  // Evaluate the compiled code
  const mod: any = { exports: {} };
  const func = new Function('require', 'module', 'exports', code);
  func(require, mod, mod.exports);

  return mod;
}
