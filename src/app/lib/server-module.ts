import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

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
