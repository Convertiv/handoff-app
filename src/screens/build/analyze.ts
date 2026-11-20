import fs from 'fs';
import path from 'path';
import type * as TS from 'typescript';
import type { ScreenRole } from '../define';
import type { ScreenMeta } from '../manifest';

/**
 * Reads a screen's `defineScreen({ ... })` options from its source. The build bakes the title, icon,
 * nav, access and fullscreen paths into the nav, the server and the page frame, and the UI module
 * cannot run in Node, so those options must be literals. The rule matches Next.js route segment config.
 */

export type { ScreenMeta };

const STATIC_OPTIONS = ['title', 'description', 'icon', 'nav', 'access', 'fullscreen'];
const ROLES: ScreenRole[] = ['member', 'admin'];

const loadTypeScript = (searchPaths: string[]): typeof TS =>
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require(require.resolve('typescript', { paths: searchPaths }));

export const readScreenMeta = (file: string, searchPaths: string[]): ScreenMeta => {
  const ts = loadTypeScript(searchPaths);
  const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const where = path.basename(file);
  const fail = (node: TS.Node | undefined, message: string): never => {
    const at = node ? source.getLineAndCharacterOfPosition(node.getStart(source)) : null;
    throw new Error(`${file}${at ? `:${at.line + 1}:${at.character + 1}` : ''}: ${message}`);
  };

  const calls: TS.CallExpression[] = [];
  const visit = (node: TS.Node) => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'defineScreen') calls.push(node);
    ts.forEachChild(node, visit);
  };
  visit(source);
  if (calls.length === 0) fail(undefined, `${where} must default-export defineScreen({ title, component }) from "handoff-app/screens".`);
  if (calls.length > 1) fail(calls[1], `${where} calls defineScreen() more than once. A screen has one definition.`);

  const options = calls[0].arguments[0];
  if (!options || !ts.isObjectLiteralExpression(options)) {
    return fail(calls[0], 'defineScreen() needs an object literal, so the build can read its title, icon, nav and access.');
  }

  const literal = (node: TS.Expression, name: string): unknown => {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
    if (ts.isNumericLiteral(node)) return Number(node.text);
    if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.MinusToken && ts.isNumericLiteral(node.operand)) {
      return -Number(node.operand.text);
    }
    if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
    if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
    if (ts.isAsExpression(node) || ts.isSatisfiesExpression(node) || ts.isParenthesizedExpression(node))
      return literal(node.expression, name);
    if (ts.isArrayLiteralExpression(node)) {
      return node.elements.map((element, index) => {
        if (ts.isSpreadElement(element)) fail(element, `\`${name}\` in defineScreen() cannot use a spread. Write each item out.`);
        return literal(element, `${name}[${index}]`);
      });
    }
    if (ts.isObjectLiteralExpression(node)) {
      const value: Record<string, unknown> = {};
      for (const property of node.properties) {
        if (!ts.isPropertyAssignment(property) || !(ts.isIdentifier(property.name) || ts.isStringLiteral(property.name))) {
          fail(property, `\`${name}\` in defineScreen() must be a plain object literal.`);
        }
        const assignment = property as TS.PropertyAssignment;
        const key = (assignment.name as TS.Identifier | TS.StringLiteral).text;
        value[key] = literal(assignment.initializer, `${name}.${key}`);
      }
      return value;
    }
    return fail(node, `\`${name}\` in defineScreen() must be a literal value. The build reads it to bake the nav and the access rules.`);
  };

  const values: Record<string, unknown> = {};
  for (const property of options.properties) {
    const name = property.name && (ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)) ? property.name.text : undefined;
    if (ts.isSpreadAssignment(property)) fail(property, 'defineScreen() options cannot use a spread. Write each option out.');
    if (!name || !STATIC_OPTIONS.includes(name)) continue;
    if (!ts.isPropertyAssignment(property)) fail(property, `\`${name}\` in defineScreen() must be written as \`${name}: <literal>\`.`);
    values[name] = literal((property as TS.PropertyAssignment).initializer, name);
  }

  const title = values.title;
  if (typeof title !== 'string' || !title.trim()) fail(options, 'defineScreen() needs a `title` string.');
  for (const key of ['description', 'icon'] as const) {
    if (values[key] !== undefined && typeof values[key] !== 'string') fail(options, `\`${key}\` in defineScreen() must be a string.`);
  }
  const nav = (values.nav ?? {}) as Record<string, unknown>;
  if (nav.weight !== undefined && typeof nav.weight !== 'number') fail(options, '`nav.weight` in defineScreen() must be a number.');
  if (nav.hidden !== undefined && typeof nav.hidden !== 'boolean') fail(options, '`nav.hidden` in defineScreen() must be true or false.');
  const access = (values.access ?? {}) as Record<string, unknown>;
  for (const key of ['read', 'write'] as const) {
    if (access[key] !== undefined && !ROLES.includes(access[key] as ScreenRole)) {
      fail(options, `\`access.${key}\` in defineScreen() must be "member" or "admin".`);
    }
  }

  const fullscreen = readFullscreen(values.fullscreen, (message) => fail(options, message));

  return {
    title: (title as string).trim(),
    description: values.description as string | undefined,
    icon: values.icon as string | undefined,
    nav: { weight: (nav.weight as number) ?? 0, hidden: (nav.hidden as boolean) ?? false },
    access: { read: (access.read as ScreenRole) ?? 'member', write: (access.write as ScreenRole) ?? 'member' },
    fullscreen,
  };
};

/** `true`, `false`, or the path patterns without leading and trailing slashes. */
const readFullscreen = (value: unknown, fail: (message: string) => never): boolean | string[] => {
  if (value === undefined) return false;
  if (typeof value === 'boolean') return value;
  if (!Array.isArray(value)) return fail('`fullscreen` in defineScreen() must be true, false or a list of path patterns.');
  return value.map((pattern) => {
    if (typeof pattern !== 'string') return fail('Each `fullscreen` pattern in defineScreen() must be a string, such as "*/view".');
    const trimmed = pattern.trim().replace(/^\/+|\/+$/g, '');
    if (trimmed.split('/').some((segment, _, all) => !segment && all.length > 1)) {
      return fail(`The \`fullscreen\` pattern "${pattern}" in defineScreen() has an empty segment. Use "*" to match any one segment.`);
    }
    return trimmed;
  });
};
