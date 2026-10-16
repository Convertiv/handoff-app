/**
 * Shared resolution of the design-token style transformers and their on-disk layout.
 *
 * Both {@link import('./styles').buildStyles} (which writes the generated token files) and the
 * registry publish packaging (which reads them back byte-for-byte) must agree on exactly which
 * transformers run, their output directories/formats, and the path each set's files land at. This
 * module is the single source of that layout so the two never drift.
 */

import { Transformers } from 'handoff-core';
import type { TransformerConfig } from '../types/config';

/** Minimal shape needed to resolve transformers: just the pipeline transformer config. */
export interface TokenTransformerContext {
  config?: { pipeline?: { transformers?: TransformerConfig[] } | null } | null;
}

/** A resolved token transformer: the factory plus its output directory, file format, and logical label. */
export interface ResolvedTokenTransformer {
  transformer: any;
  outDir: string;
  format: string;
  /** Stable logical label for the output (`css`|`scss`|`types`|`styleDictionary`|custom `outDir`). */
  label: string;
}

/** The three core transformers Handoff always runs, matching the historical `buildStyles` defaults. */
const CORE_TRANSFORMERS = [
  { transformer: Transformers.ScssTransformer, outDir: 'sass', format: 'scss', label: 'scss' },
  { transformer: Transformers.ScssTypesTransformer, outDir: 'types', format: 'scss', label: 'types' },
  { transformer: Transformers.CssTransformer, outDir: 'css', format: 'css', label: 'css' },
] as const;

/** Logical label for a transformer factory: known core/SD labels, else the custom transformer's outDir. */
const labelForTransformer = (transformer: any, outDir: string): string => {
  if (transformer === Transformers.ScssTransformer) return 'scss';
  if (transformer === Transformers.ScssTypesTransformer) return 'types';
  if (transformer === Transformers.CssTransformer) return 'css';
  if (transformer === Transformers.StyleDictionaryTransformer) return 'styleDictionary';
  return outDir;
};

/**
 * Resolve the merged transformer list (core + user-configured). A user transformer matching a core
 * transformer overrides its `outDir`/`format`; other user transformers (e.g. Style Dictionary or a
 * fully custom transformer) are appended. Mirrors the historical inline logic in `buildStyles`.
 */
export const resolveTokenTransformers = (context: TokenTransformerContext): ResolvedTokenTransformer[] => {
  const userTransformers = context.config?.pipeline?.transformers || [];

  const transformers: ResolvedTokenTransformer[] = CORE_TRANSFORMERS.map((core) => {
    const override = userTransformers.find((t) => t.transformer === core.transformer);
    return override
      ? { transformer: core.transformer, outDir: override.outDir, format: override.format, label: labelForTransformer(core.transformer, override.outDir) }
      : { ...core };
  });

  userTransformers.forEach((userTransformer) => {
    if (!CORE_TRANSFORMERS.some((core) => core.transformer === userTransformer.transformer)) {
      transformers.push({
        transformer: userTransformer.transformer,
        outDir: userTransformer.outDir,
        format: userTransformer.format,
        label: labelForTransformer(userTransformer.transformer, userTransformer.outDir),
      });
    }
  });

  return transformers;
};

/** A generated token artifact expected for a set: its registry-safe relative path + logical label. */
export interface TokenArtifactLayout {
  /** Path relative to `getVariablesFilePath()`, e.g. `css/colors.css` or `sd/button/button.tokens.json`. */
  path: string;
  /** Logical format label (`css`|`scss`|`types`|`styleDictionary`|custom). */
  format: string;
}

/**
 * Compute the registry-safe relative paths (under `getVariablesFilePath()`) a single set's generated
 * files land at, across every resolved transformer. Honors the Style Dictionary nesting special-case
 * (`buildStyles`): SD component tokens go to `<outDir>/<name>/<name>.tokens.json`, SD foundation
 * tokens to `<outDir>/<name>.tokens.json`; every other transformer writes `<outDir>/<name>.<format>`.
 */
export const tokenArtifactPathsForSet = (
  transformers: ResolvedTokenTransformer[],
  setName: string,
  isComponent: boolean
): TokenArtifactLayout[] =>
  transformers.map(({ outDir, format, label }) => {
    if (label === 'styleDictionary') {
      const path = isComponent ? `${outDir}/${setName}/${setName}.tokens.json` : `${outDir}/${setName}.tokens.json`;
      return { path, format: label };
    }
    return { path: `${outDir}/${setName}.${format}`, format: label };
  });
