import fs from 'fs-extra';
import { isCSSRequest, preprocessCSS, type ResolvedConfig } from 'vite';

/**
 * Every file that the given stylesheets load, such as Sass partials through `@use`, `@forward` and
 * `@import`, transitively. Files that are not stylesheets are skipped.
 *
 * A stylesheet that a compiler reads by URL, such as an Angular `styleUrl`, never reaches the Vite
 * CSS pipeline as a module, so no build records what it loads. This compiles it once more with
 * Vite's preprocessor and the build's resolved config, so aliases and preprocessor `loadPaths` match
 * the compile that produced the styles.
 */
export async function collectStylesheetDependencies(files: string[], config: ResolvedConfig): Promise<string[]> {
  const dependencies = await Promise.all(
    files
      .filter((file) => isCSSRequest(file))
      .map(async (file) => {
        const { deps } = await preprocessCSS(await fs.readFile(file, 'utf8'), file, config);
        return [...(deps ?? [])];
      })
  );
  return dependencies.flat();
}
