import fs from 'fs-extra';
import { register } from 'module';
import path from 'path';
import { pathToFileURL } from 'url';
import { Logger } from '../../utils/logger';

/**
 * A package that a renderer needs from the workspace. Handoff ships nothing that belongs to one
 * framework, so a project installs only the tooling of the renderers it uses.
 */
export type WorkspacePackage = {
  name: string;
  /** Lowest supported version, as `major.minor`. */
  min?: string;
  /** Highest supported major. A newer major is untested, so it is rejected. */
  maxMajor?: number;
  /** A build tool, which the install command adds with `-D`. */
  dev?: boolean;
};

/**
 * The workspace lacks a package that a renderer needs, or has an unsupported version. The fix is the
 * same for every component of the renderer, so the build reports it once instead of per component.
 */
export class WorkspaceSetupError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WorkspaceSetupError';
  }
}

const parseVersion = (version: string): [number, number] => {
  const [major, minor] = version.split('.').map((part) => Number.parseInt(part, 10));
  return [major || 0, minor || 0];
};

/** True when `version` is `min` (`major.minor`) or later. */
export const isAtLeast = (version: string, min: string): boolean => {
  const [major, minor] = parseVersion(version);
  const [minMajor, minMinor] = parseVersion(min);
  return major > minMajor || (major === minMajor && minor >= minMinor);
};

const supportedRange = ({ min, maxMajor }: WorkspacePackage): string =>
  [min && `${min} or later`, maxMajor !== undefined && `before ${maxMajor + 1}.0`].filter(Boolean).join(' and ');

const installCommand = (packages: WorkspacePackage[]): string =>
  [packages.filter((pkg) => !pkg.dev), packages.filter((pkg) => pkg.dev)]
    .filter((group) => group.length)
    .map((group) => `npm install ${group[0].dev ? '-D ' : ''}${group.map(({ name, min }) => (min ? `${name}@^${min}` : name)).join(' ')}`)
    .join(' && ');

/**
 * Checks that the workspace has every package in a supported version, and returns their versions by
 * name. One error lists every missing or unsupported package with the command that installs them.
 */
export const requireWorkspacePackages = (renderer: string, packages: WorkspacePackage[], workingPath: string): Record<string, string> => {
  const versions: Record<string, string> = {};
  const problems: string[] = [];
  const toInstall: WorkspacePackage[] = [];
  for (const pkg of packages) {
    const directory = findPackageDir(pkg.name, [workingPath]);
    const version: string | undefined = directory && fs.readJsonSync(path.join(directory, 'package.json'), { throws: false })?.version;
    if (!version) {
      problems.push(`${pkg.name} is missing`);
      toInstall.push(pkg);
      continue;
    }
    versions[pkg.name] = version;
    const [major] = parseVersion(version);
    if ((pkg.min && !isAtLeast(version, pkg.min)) || (pkg.maxMajor !== undefined && major > pkg.maxMajor)) {
      problems.push(`${pkg.name} ${version} is not supported (supported: ${supportedRange(pkg)})`);
      toInstall.push(pkg);
    }
  }
  if (problems.length) {
    throw new WorkspaceSetupError(
      `${renderer} previews need packages in the workspace: ${problems.join('; ')}. Run: ${installCommand(toInstall)}`
    );
  }
  return versions;
};

/**
 * The real directory of an installed package, looked up the way Node looks up `node_modules` from each
 * of `searchDirs`. It does not resolve `<name>/package.json`, which fails for a package whose `exports`
 * leave that file out.
 */
const findPackageDir = (name: string, searchDirs: string[]): string | undefined => {
  for (const searchDir of searchDirs) {
    for (let directory = path.resolve(searchDir); ; directory = path.dirname(directory)) {
      const candidate = path.join(directory, 'node_modules', name);
      if (fs.existsSync(path.join(candidate, 'package.json'))) return fs.realpathSync(candidate);
      if (path.dirname(directory) === directory) break;
    }
  }
  return undefined;
};

/** The real directory of an installed package, from the first of `searchDirs` that has it. */
export const packageDir = (name: string, searchDirs: string[]): string => {
  const directory = findPackageDir(name, searchDirs);
  if (!directory) throw new Error(`Cannot find the package "${name}" from ${searchDirs.join(', ')}.`);
  return directory;
};

/**
 * Makes a workspace's Vite plugin import the Vite that Handoff builds with. A plugin is a peer of Vite,
 * so it resolves the workspace's Vite when the workspace has one, and would then transform files with a
 * different copy than the build that runs it. A resolve hook makes `vite` imports from the plugin's
 * directory resolve from Handoff's package. It is registered once per plugin directory.
 */
const redirectedPluginDirs = new Set<string>();
export const useHandoffVite = (pluginName: string, workingPath: string, modulePath: string): void => {
  const pluginDir = packageDir(pluginName, [workingPath]);
  const handoffVite = packageDir('vite', [modulePath]);
  if (redirectedPluginDirs.has(pluginDir) || packageDir('vite', [pluginDir]) === handoffVite) return;
  const scope = `${pathToFileURL(pluginDir).href}/`;
  const parent = pathToFileURL(path.join(modulePath, 'package.json')).href;
  const hooks = `export async function resolve(specifier, context, next) {
    if ((specifier === 'vite' || specifier.startsWith('vite/')) && context.parentURL && context.parentURL.startsWith(${JSON.stringify(scope)})) {
      return next(specifier, { ...context, parentURL: ${JSON.stringify(parent)} });
    }
    return next(specifier, context);
  }`;
  register(`data:text/javascript,${encodeURIComponent(hooks)}`);
  redirectedPluginDirs.add(pluginDir);
  Logger.debug(`${pluginName} in ${pluginDir} uses the Vite in ${handoffVite}`);
};
