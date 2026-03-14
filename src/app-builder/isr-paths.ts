/**
 * ISR path resolver: computes which static output files (under out/) are affected
 * for a given page path or "menu changed", for use with partial deploy.
 *
 * Mirrors the route structure from buildL1StaticPaths / buildL2StaticPaths (see app/components/util)
 * but runs in CLI context using handoff paths instead of process.env.
 */
import fs from 'fs-extra';
import path from 'path';
import Handoff from '..';

/** Route segments excluded from doc/page path generation (same as knownPaths in util) */
const KNOWN_PATHS = [
  'assets',
  'assets/fonts',
  'assets/icons',
  'assets/logos',
  'foundations',
  'foundations/colors',
  'foundations/icons',
  'foundations/effects',
  'foundations/logos',
  'foundations/logo',
  'foundations/typography',
  'system',
  'system/component',
  'playground',
];

/**
 * Returns level-1 path segments (one segment, e.g. "guidelines") for doc/pages.
 */
export function getL1StaticPathSegments(modulePath: string, workingPath: string): string[] {
  const docRoot = path.resolve(modulePath, 'config/docs');
  const pageRoot = path.resolve(workingPath, 'pages');
  if (!fs.existsSync(docRoot)) {
    return [];
  }
  let files: string[] = fs.readdirSync(docRoot);
  if (fs.existsSync(pageRoot)) {
    // ES5-compatible way to merge and deduplicate both arrays
    var moreFiles = fs.readdirSync(pageRoot);
    for (var i = 0; i < moreFiles.length; i++) {
      if (files.indexOf(moreFiles[i]) === -1) {
        files.push(moreFiles[i]);
      }
    }
  }
  return files
    .filter((fileName) => {
      const inDoc = path.join(docRoot, fileName);
      const inPages = path.join(pageRoot, fileName);
      if (fs.existsSync(inDoc)) return !fs.lstatSync(inDoc).isDirectory();
      if (fs.existsSync(inPages)) return !fs.lstatSync(inPages).isDirectory();
      return false;
    })
    .filter((fileName) => fileName.endsWith('.md'))
    .map((fileName) => fileName.replace('.md', ''))
    .filter((segment) => !KNOWN_PATHS.includes(segment));
}

/**
 * Returns level-2 path segments { level1, level2 } for doc/pages.
 */
export function getL2StaticPathSegments(modulePath: string, workingPath: string): Array<{ level1: string; level2: string }> {
  const docRoot = path.resolve(modulePath, 'config/docs');
  const pageRoot = path.resolve(workingPath, 'pages');
  if (!fs.existsSync(docRoot)) {
    return [];
  }
  let list: string[] = fs.readdirSync(docRoot);
  if (fs.existsSync(pageRoot)) {
    var moreFiles = fs.readdirSync(pageRoot);
    for (var i = 0; i < moreFiles.length; i++) {
      if (list.indexOf(moreFiles[i]) === -1) {
        list.push(moreFiles[i]);
      }
    }
  }
  const result: Array<{ level1: string; level2: string }> = [];
  for (const fileName of list) {
    let dirPath: string;
    if (fs.existsSync(path.join(pageRoot, fileName))) {
      dirPath = path.join(pageRoot, fileName);
    } else if (fs.existsSync(path.join(docRoot, fileName))) {
      dirPath = path.join(docRoot, fileName);
    } else {
      continue;
    }
    if (!fs.lstatSync(dirPath).isDirectory()) continue;
    const subFiles = fs.readdirSync(dirPath);
    for (const subFile of subFiles) {
      if (!subFile.endsWith('.md')) continue;
      const level2 = subFile.replace('.md', '');
      const fullKey = `${fileName}/${level2}`;
      if (KNOWN_PATHS.includes(fullKey)) continue;
      result.push({ level1: fileName, level2 });
    }
  }
  return result;
}

/**
 * Normalize a route path (e.g. "/guidelines" or "foundations/colors") to a segment path without leading slash.
 */
export function normalizeRoutePath(routePath: string): string {
  return routePath.replace(/^\/+/, '').replace(/\/+$/, '');
}

/**
 * Resolve a single route path to the corresponding static output file path(s) under out/.
 * Next.js static export with trailingSlash produces path/index.html for each route.
 */
export function routePathToOutputPaths(routePath: string): string[] {
  const segment = normalizeRoutePath(routePath);
  if (!segment) return ['index.html'];
  return [`${segment}/index.html`];
}

/**
 * Resolve affected static output file paths (relative to out/) for ISR.
 *
 * @param handoff - Handoff instance (used for modulePath, workingPath)
 * @param options.path - Single route path to invalidate (e.g. "/guidelines", "foundations/colors")
 * @param options.paths - Multiple route paths to invalidate
 * @param options.menuChanged - If true, return all menu-linked routes (all doc pages + system index pages)
 * @returns Relative paths under out/, e.g. ["index.html", "guidelines/index.html"]
 */
export function resolveAffectedOutputPaths(
  handoff: Handoff,
  options: { path?: string; paths?: string[]; menuChanged?: boolean }
): string[] {
  const { path: singlePath, paths: pathList, menuChanged } = options;
  const modulePath = handoff.modulePath;
  const workingPath = handoff.workingPath;

  if (menuChanged) {
    const l1 = getL1StaticPathSegments(modulePath, workingPath);
    const l2 = getL2StaticPathSegments(modulePath, workingPath);
    const out: string[] = ['index.html'];
    for (const segment of l1) {
      out.push(`${segment}/index.html`);
    }
    for (const { level1, level2 } of l2) {
      out.push(`${level1}/${level2}/index.html`);
    }
    out.push('system/index.html', 'system/component/index.html');
    // ES5-compatible alternative to [...new Set(out)]
    var unique = [];
    for (var i = 0; i < out.length; i++) {
      if (unique.indexOf(out[i]) === -1) {
        unique.push(out[i]);
      }
    }
    return unique;
  }

  if (singlePath) {
    return routePathToOutputPaths(singlePath);
  }

  if (pathList && pathList.length > 0) {
    const out: string[] = [];
    for (const p of pathList) {
      out.push(...routePathToOutputPaths(p));
    }
    // ES5-compatible alternative to [...new Set(out)]
    var unique = [];
    for (var i = 0; i < out.length; i++) {
      if (unique.indexOf(out[i]) === -1) {
        unique.push(out[i]);
      }
    }
    return unique;
  }

  return [];
}

/**
 * Resolve affected static output file paths for a component ISR update.
 * Returns paths under out/ for the component route, component list, and API JSON files.
 */
export function resolveComponentAffectedOutputPaths(componentId: string): string[] {
  return [
    `system/component/${componentId}/index.html`,
    'system/component/index.html',
    `api/component/${componentId}.json`,
    'api/components.json',
  ];
}

/**
 * Resolve affected output paths for multiple components (union).
 */
export function resolveComponentAffectedOutputPathsBatch(componentIds: string[]): string[] {
  const out: string[] = ['system/component/index.html', 'api/components.json'];
  for (const id of componentIds) {
    out.push(`system/component/${id}/index.html`, `api/component/${id}.json`);
  }
  // ES5-compatible alternative to [...new Set(out)]
  var unique = [];
  for (var i = 0; i < out.length; i++) {
    if (unique.indexOf(out[i]) === -1) {
      unique.push(out[i]);
    }
  }
  return unique;
}

/**
 * Resolve affected static output file paths for a pattern ISR update.
 * Returns paths under out/ for the pattern API JSON and summary.
 */
export function resolvePatternAffectedOutputPaths(patternId: string): string[] {
  return [
    `api/pattern/${patternId}.json`,
    'api/patterns.json',
  ];
}

/**
 * Resolve affected output paths for multiple patterns (union).
 */
export function resolvePatternAffectedOutputPathsBatch(patternIds: string[]): string[] {
  const out: string[] = ['api/patterns.json'];
  for (const id of patternIds) {
    out.push(`api/pattern/${id}.json`);
  }
  // ES5-compatible alternative to [...new Set(out)]
  var unique = [];
  for (var i = 0; i < out.length; i++) {
    if (unique.indexOf(out[i]) === -1) {
      unique.push(out[i]);
    }
  }
  return unique;
}
