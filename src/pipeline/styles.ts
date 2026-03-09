import fs from 'fs-extra';
import { Types as HandoffTypes, Transformers } from 'handoff-core';
import { sortedUniq } from 'lodash';
import path from 'path';
import Handoff from '..';
import { FontFamily } from '../types/font';
import { zip } from './archive';

/**
 * Build just the custom fonts — zips font directories and copies them to the export folder.
 */
export const buildCustomFonts = async (handoff: Handoff, documentationObject: HandoffTypes.IDocumentationObject) => {
  const { localStyles } = documentationObject;
  const fontLocation = path.join(handoff?.workingPath, 'fonts');
  const families: FontFamily = localStyles.typography.reduce((result, current) => {
    return {
      ...result,
      [current.values.fontFamily]: result[current.values.fontFamily]
        ? // sorts and returns unique font weights
          sortedUniq([...result[current.values.fontFamily], current.values.fontWeight].sort((a, b) => a - b))
        : [current.values.fontWeight],
    };
  }, {} as FontFamily);

  await Promise.all(Object.keys(families).map(async (key) => {
    const name = key.replace(/\s/g, '');
    const fontDirName = path.join(fontLocation, name);
    if (fs.existsSync(fontDirName)) {
      const stream = fs.createWriteStream(path.join(fontLocation, `${name}.zip`));
      await zip(fontDirName, stream);
      const fontsFolder = path.resolve(handoff.workingPath, handoff.exportsDirectory, handoff.getProjectId(), 'fonts');
      if (!fs.existsSync(fontsFolder)) {
        fs.mkdirSync(fontsFolder);
      }
      fs.copySync(fontDirName, fontsFolder);
    }
  }));
};

/**
 * Builds design token style files using core and user-configured transformers.
 */
export const buildStyles = async (handoff: Handoff, documentationObject: HandoffTypes.IDocumentationObject) => {
  // Core transformers that should always be included
  const coreTransformers = [
    {
      transformer: Transformers.ScssTransformer,
      outDir: 'sass',
      format: 'scss',
    },
    {
      transformer: Transformers.ScssTypesTransformer,
      outDir: 'types',
      format: 'scss',
    },
    {
      transformer: Transformers.CssTransformer,
      outDir: 'css',
      format: 'css',
    },
  ];

  // Get user-configured transformers
  const userTransformers = handoff.config?.pipeline?.transformers || [];

  // Merge core transformers with user transformers
  // If a user transformer matches a core transformer, use user's outDir and format
  const transformers = coreTransformers.map((coreTransformer) => {
    const userTransformer = userTransformers.find((t) => t.transformer === coreTransformer.transformer);
    return userTransformer ? { ...coreTransformer, outDir: userTransformer.outDir, format: userTransformer.format } : coreTransformer;
  });

  // Add any additional user transformers that aren't core transformers
  userTransformers.forEach((userTransformer) => {
    if (!coreTransformers.some((core) => core.transformer === userTransformer.transformer)) {
      transformers.push(userTransformer);
    }
  });

  const baseDir = handoff.getVariablesFilePath();
  const runner = await handoff.getRunner();

  // Create transformer instances and transform documentation object
  const transformedFiles = transformers.map(({ transformer }) => ({
    transformer,
    files: runner.transform(transformer({ useVariables: handoff.config?.useVariables }), documentationObject),
  }));

  // Ensure base directory exists
  await fs.ensureDir(baseDir);

  // Create all necessary subdirectories
  const directories = transformers.map(({ outDir }) => path.join(baseDir, outDir));
  await Promise.all(directories.map((dir) => fs.ensureDir(dir)));

  // Special case for SD tokens components directory
  const sdTransformer = transformers.find((t) => t.transformer === Transformers.StyleDictionaryTransformer);
  if (sdTransformer) {
    const sdFiles = transformedFiles.find((t) => t.transformer === Transformers.StyleDictionaryTransformer)?.files;
    if (sdFiles?.components) {
      await Promise.all(Object.keys(sdFiles.components).map((name) => fs.ensureDir(path.join(baseDir, sdTransformer.outDir, name))));
    }
  }

  // Write all files
  const writePromises = transformedFiles.flatMap(({ transformer: TransformerClass, files }) => {
    const { outDir, format } = transformers.find((t) => t.transformer === TransformerClass) || {};
    if (!outDir || !files) return [];

    const componentPromises = Object.entries(files.components || {}).map(([name, content]) => {
      const filePath =
        TransformerClass === Transformers.StyleDictionaryTransformer
          ? path.join(baseDir, outDir, name, `${name}.tokens.json`)
          : path.join(baseDir, outDir, `${name}.${format}`);
      return fs.writeFile(filePath, content);
    });

    const designPromises = Object.entries(files.design || {}).map(([name, content]) => {
      const filePath =
        TransformerClass === Transformers.StyleDictionaryTransformer
          ? path.join(baseDir, outDir, `${name}.tokens.json`)
          : path.join(baseDir, outDir, `${name}.${format}`);
      return fs.writeFile(filePath, content);
    });

    return [...componentPromises, ...designPromises];
  });

  // Generate tokens-map.json
  const mapFiles = transformedFiles.find((t) => t.transformer === Transformers.MapTransformer)?.files;
  if (mapFiles) {
    const tokensMapContent = JSON.stringify(
      Object.entries(mapFiles.components || {}).reduce(
        (acc, [_, data]) => ({
          ...acc,
          ...JSON.parse(data as string),
        }),
        {
          ...JSON.parse(mapFiles.design.colors as string),
          ...JSON.parse(mapFiles.design.typography as string),
          ...JSON.parse(mapFiles.design.effects as string),
        }
      ),
      null,
      2
    );
    writePromises.push(fs.writeFile(path.join(handoff.getOutputPath(), 'tokens-map.json'), tokensMapContent));
  }

  // Write all files
  await Promise.all(writePromises);
};
