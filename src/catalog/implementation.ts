import fs from 'fs-extra';
import path from 'path';
import { RENDERERS, rendererImportedBy, sourceForFile, type RendererKind } from './renderers';

/** A source file plus the export the implementation is bound to. */
export type ResolvedSource = {
  file: string;
  /** `default`, a named export, or `*` for a namespace import. */
  exportName: string;
};

const CANDIDATE_EXTENSIONS = ['.tsx', '.jsx', '.ts', '.js', '.mjs', '.cjs'];

/**
 * Resolves a relative module specifier to a file. Node and bundlers probe extensions and index
 * files; `path.resolve` alone does not. A bare specifier (a package, or a tsconfig path alias) is
 * not resolvable against the workspace, so it returns undefined.
 */
export const resolveModulePath = (specifier: string, fromFile: string): string | undefined => {
  if (!specifier.startsWith('.') && !path.isAbsolute(specifier)) return undefined;

  const base = path.resolve(path.dirname(fromFile), specifier);
  if (fs.existsSync(base) && fs.statSync(base).isFile()) return base;

  for (const extension of CANDIDATE_EXTENSIONS) {
    const candidate = `${base}${extension}`;
    if (fs.existsSync(candidate)) return candidate;
  }
  for (const extension of CANDIDATE_EXTENSIONS) {
    const candidate = path.join(base, `index${extension}`);
    if (fs.existsSync(candidate)) return candidate;
  }

  return undefined;
};

/** Reads the identifier a property is bound to, e.g. `implementation: Button` or `component: UI.Card`. */
const readPropertyIdentifier = (sourceCode: string, property: string): string | undefined => {
  const match = sourceCode.match(new RegExp(`\\b${property}\\s*:\\s*([A-Za-z_$][\\w$]*(?:\\.[A-Za-z_$][\\w$]*)*)\\s*(?![\\w$(])`));
  return match?.[1];
};

/** Finds which export of an import clause is bound to `localName`. */
const matchImportClause = (clause: string, localName: string): string | undefined => {
  const namespaceMatch = clause.match(/\*\s+as\s+([A-Za-z_$][\w$]*)/);
  if (namespaceMatch?.[1] === localName) return '*';

  const bracesMatch = clause.match(/\{([\s\S]*)\}/);
  if (bracesMatch) {
    for (const rawSpecifier of bracesMatch[1].split(',')) {
      const specifier = rawSpecifier.trim().replace(/^type\s+/, '');
      if (!specifier) continue;

      const aliased = specifier.match(/^([A-Za-z_$][\w$]*)\s+as\s+([A-Za-z_$][\w$]*)$/);
      if (aliased) {
        if (aliased[2] === localName) return aliased[1];
        continue;
      }
      if (specifier === localName) return specifier;
    }
  }

  const defaultBinding = clause.split(',')[0].trim();
  if (/^[A-Za-z_$][\w$]*$/.test(defaultBinding) && defaultBinding === localName) return 'default';

  return undefined;
};

type Binding = { specifier: string; exportName: string };

const findBinding = (sourceCode: string, localName: string): Binding | undefined => {
  for (const match of sourceCode.matchAll(/import\s+([\s\S]*?)\s+from\s*['"]([^'"]+)['"]/g)) {
    const exportName = matchImportClause(match[1].trim(), localName);
    if (exportName) return { specifier: match[2], exportName };
  }

  const requireBinding = sourceCode.match(
    new RegExp(`(?:const|let|var)\\s+${localName}\\s*=\\s*require\\(\\s*['"]([^'"]+)['"]\\s*\\)(?:\\.([A-Za-z_$][\\w$]*))?`)
  );
  if (requireBinding) {
    return { specifier: requireBinding[1], exportName: requireBinding[2] ?? '*' };
  }

  const requireNamed = sourceCode.match(
    new RegExp(`(?:const|let|var)\\s*\\{([^}]*\\b${localName}\\b[^}]*)\\}\\s*=\\s*require\\(\\s*['"]([^'"]+)['"]\\s*\\)`)
  );
  if (requireNamed) {
    // `{ default: Button }` binds `Button` to the `default` export.
    const renamed = requireNamed[1].match(new RegExp(`([A-Za-z_$][\\w$]*)\\s*:\\s*${localName}\\b`));
    return { specifier: requireNamed[2], exportName: renamed?.[1] ?? localName };
  }

  return undefined;
};

/**
 * Stands in for an implementation module that the loader must not run. Every export, including
 * `default`, is a named empty class, so any import form binds without knowing the export names.
 *
 * The lookups live on the prototype because esbuild's ESM interop copies a CommonJS module onto a new
 * object with the same prototype, and a Proxy cannot list names it does not know.
 */
export const createImplementationPlaceholder = (): object => {
  const placeholders = new Map<string, unknown>();
  const anyExport = new Proxy(
    {},
    {
      get: (_target, key) => {
        if (key === '__esModule') return true;
        if (typeof key !== 'string') return undefined;
        if (!placeholders.has(key)) placeholders.set(key, Object.defineProperty(class {}, 'name', { value: key }));
        return placeholders.get(key);
      },
    }
  );
  return Object.create(anyExport);
};

/**
 * Resolves the value a property is bound to back to its source file.
 *
 * Two callers use this: `implementation:` inside a catalog declaration, and `component:` inside a
 * CSF meta object. In both cases only the value is authored, so the file has to be recovered from
 * the import that produced it.
 */
export const resolvePropertySource = (sourcePath: string, property: string): ResolvedSource | undefined => {
  let sourceCode: string;
  try {
    sourceCode = fs.readFileSync(sourcePath, 'utf8');
  } catch {
    return undefined;
  }

  const identifier = readPropertyIdentifier(sourceCode, property);
  if (!identifier) return undefined;

  const [localName, ...memberPath] = identifier.split('.');
  const binding = findBinding(sourceCode, localName);
  if (!binding) return undefined;

  const file = resolveModulePath(binding.specifier, sourcePath);
  if (!file) return undefined;

  // `UI.Button` names the export directly; a namespace import on its own has no single export.
  const exportName = memberPath.length ? memberPath[memberPath.length - 1] : binding.exportName;
  return { file, exportName: exportName === '*' ? 'default' : exportName };
};

/**
 * Last-resort lookup when the import cannot be resolved: the single file next to the declaration
 * whose name only `renderer` can own. Source format files, such as stories, are excluded.
 */
export const findSiblingComponentFile = (directory: string, declarationPath: string, renderer: RendererKind): string | undefined => {
  if (!fs.existsSync(directory)) return undefined;

  const candidates = fs
    .readdirSync(directory)
    .filter((name) => {
      const claim = sourceForFile(name);
      return !!claim && !claim.format && claim.renderers.includes(renderer);
    })
    .map((name) => path.resolve(directory, name))
    .filter((file) => file !== path.resolve(declarationPath));

  return candidates.length === 1 ? candidates[0] : undefined;
};

/** True when `file` sits inside `directory`. Publish rejects any path that escapes the entity directory. */
export const isInsideDirectory = (file: string, directory: string): boolean => {
  const relative = path.relative(directory, file);
  return !!relative && !relative.startsWith('..') && !path.isAbsolute(relative);
};

/**
 * The implementation file that reading this declaration must not run, resolved from its import text
 * like `componentExport`. Undefined when the renderer may run it. The loader binds a placeholder for
 * the file, and the build cache leaves it out of the declaration's module graph.
 */
export const implementationToSkip = (filePath: string): string | undefined => {
  let sourceCode: string;
  try {
    sourceCode = fs.readFileSync(filePath, 'utf8');
  } catch {
    return undefined;
  }
  const renderer = rendererImportedBy(sourceCode);
  if (!renderer || RENDERERS[renderer].loadsImplementation) return undefined;
  return resolvePropertySource(filePath, 'implementation')?.file;
};
