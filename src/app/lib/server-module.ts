import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { resolveEnvReferences } from '@handoff/config/from-env';

/**
 * Import a consumer's server-only module (a custom asset storage adapter, AI provider or email
 * provider) by the path the config gives, relative to the project.
 *
 * A registry bundle mirrors the tracing root and runs with its root as the working directory, so the
 * traced copy is at `<cwd>/<HANDOFF_BUNDLE_PROJECT_DIR>/<module>`. A workspace server reads the
 * original file under `HANDOFF_WORKING_PATH`. A bare import would resolve against the webpack chunk.
 */
export const importServerModule = async (specifier: string): Promise<any> => {
  const candidates = path.isAbsolute(specifier)
    ? [specifier]
    : [
        path.resolve(process.cwd(), process.env.HANDOFF_BUNDLE_PROJECT_DIR ?? '', specifier),
        path.resolve(process.env.HANDOFF_WORKING_PATH ?? process.cwd(), specifier),
      ];
  const target = candidates.find((candidate) => fs.existsSync(candidate)) ?? candidates[candidates.length - 1];
  return import(/* webpackIgnore: true */ pathToFileURL(target).href);
};

/**
 * Import a custom module and return its default export. A factory export is called first, with
 * `fromEnv()` values in `context.options` resolved.
 */
export const loadServerModule = async (specifier: string, context: { options?: Record<string, unknown>; [key: string]: unknown }): Promise<unknown> => {
  const mod = await importServerModule(specifier);
  const exported = mod?.default ?? mod;
  if (typeof exported !== 'function') return exported;
  return exported({ ...context, options: resolveEnvReferences(context.options ?? {}, process.env), env: process.env });
};
