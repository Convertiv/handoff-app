import fs from 'fs-extra';
import path from 'path';
import { SCREEN_ID_PATTERN } from './declarations';

/**
 * `make:screen <id>`: writes a working screen (a collection, a tool and a `ScreenLayout` view) and
 * declares it in the main config when that can be done with a plain text edit.
 */

const TEMPLATES = ['index.tsx', 'collections.ts', 'tools.ts'];

const titleOf = (id: string): string =>
  id
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const componentOf = (id: string): string => `${titleOf(id).replace(/[^A-Za-z0-9]/g, '')}Screen`;

export interface ScaffoldResult {
  directory: string;
  files: string[];
  /** Whether the declaration was added to the config. Otherwise `declaration` must be added by hand. */
  declared: boolean;
  declaration: string;
}

/** Add the declaration to a `defineConfig({ ... })` config that has no `screens` key or has a `screens: [` list. */
const declareInConfig = async (configPath: string | undefined, declaration: string): Promise<boolean> => {
  if (!configPath || !/\.(ts|js|cjs|mjs)$/.test(configPath)) return false;
  const source = await fs.readFile(configPath, 'utf8');
  let next: string | null = null;
  if (/\bscreens\s*:\s*\[/.test(source)) {
    next = source.replace(/\bscreens\s*:\s*\[/, (match) => `${match}\n    ${declaration},`);
  } else if (!/\bscreens\s*:/.test(source) && /defineConfig\(\s*\{/.test(source)) {
    next = source.replace(/defineConfig\(\s*\{/, (match) => `${match}\n  screens: [${declaration}],`);
  }
  if (!next) return false;
  await fs.writeFile(configPath, next);
  return true;
};

export const scaffoldScreen = async (options: {
  id: string;
  workingPath: string;
  modulePath: string;
  configPath?: string;
}): Promise<ScaffoldResult> => {
  if (!SCREEN_ID_PATTERN.test(options.id)) {
    throw new Error(`"${options.id}" is not a valid screen id. Use lowercase letters, digits and "-", starting with a letter.`);
  }
  const directory = path.resolve(options.workingPath, 'screens', options.id);
  if (await fs.pathExists(directory)) throw new Error(`${path.relative(options.workingPath, directory)} already exists. Pick another id.`);

  const values: Record<string, string> = {
    title: titleOf(options.id),
    component: componentOf(options.id),
    prefix: options.id.replace(/-/g, '_'),
  };
  await fs.ensureDir(directory);
  const files: string[] = [];
  for (const name of TEMPLATES) {
    const template = await fs.readFile(path.join(options.modulePath, 'templates', 'screen', `${name}.tpl`), 'utf8');
    const target = path.join(directory, name);
    await fs.writeFile(
      target,
      template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => values[key] ?? '')
    );
    files.push(target);
  }

  const module = `./${path.relative(options.workingPath, directory).split(path.sep).join('/')}`;
  const declaration = `{ id: '${options.id}', module: '${module}' }`;
  return { directory, files, declared: await declareInConfig(options.configPath, declaration), declaration };
};
