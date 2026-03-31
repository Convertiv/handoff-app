import readline from 'readline';

import chalk from 'chalk';

/** Logical source of a log line — used for a fixed-width–style colored tag after the timestamp. */
export type LogScope = 'handoff' | 'vite' | 'next';

/**
 * Env (e.g. project `.env` via `dotenv/config`):
 * - `HANDOFF_LOG_LEVEL` — `debug` | `info` | `warn` | `error` | `silent` (default: `info`).
 *   Controls minimum severity: at `warn`, info/success/debug lines are hidden; at `error`, only errors.
 * - `HANDOFF_LOG_SCOPES` — comma-separated allowlist: `handoff`, `vite`, `next`. Defaults to all three if unset or empty.
 *
 * Programmatic `Logger.init({ debug: true })` (Handoff `debug` flag) forces debug-level verbosity unless overridden.
 */
export class Logger {
  /** From Handoff constructor; enables debug lines together with env. */
  private static debugMode = false;

  /** Minimum message severity to print: 0=debug, 1=info, 2=warn, 3=error. `silent` uses 99. */
  private static severityThreshold = 1;

  /** Enabled scopes; defaults to all of `handoff`, `vite`, `next`. */
  private static scopesFilter: Set<LogScope> = new Set<LogScope>(['handoff', 'vite', 'next']);

  static init(options?: { debug?: boolean }) {
    this.applyEnvConfig();
    if (options?.debug !== undefined) {
      this.debugMode = options.debug;
    }
    if (options?.debug === true) {
      this.severityThreshold = 0;
    }
  }

  /** Re-read `process.env` (useful if env is loaded after first `init`). */
  static applyEnvConfig() {
    this.severityThreshold = 1;
    const allScopes: LogScope[] = ['handoff', 'vite', 'next'];
    this.scopesFilter = new Set(allScopes);

    const levelRaw = process.env.HANDOFF_LOG_LEVEL?.trim().toLowerCase();
    const levelMap: Record<string, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
      silent: 99,
    };
    if (levelRaw && levelRaw in levelMap) {
      this.severityThreshold = levelMap[levelRaw];
    }

    const scopesRaw = process.env.HANDOFF_LOG_SCOPES?.trim();
    if (scopesRaw) {
      const set = new Set<LogScope>();
      for (const part of scopesRaw.split(',')) {
        const s = part.trim().toLowerCase();
        if (s === 'handoff' || s === 'vite' || s === 'next') {
          set.add(s);
        }
      }
      if (set.size > 0) {
        this.scopesFilter = set;
      }
    }
  }

  private static scopeEnabled(scope: LogScope): boolean {
    return this.scopesFilter.has(scope);
  }

  /** Message severities: debug=0, info-tier=1, warn=2, error=3 */
  private static shouldEmit(severity: 0 | 1 | 2 | 3): boolean {
    return severity >= this.severityThreshold;
  }

  private static getTimestamp(): string {
    const now = new Date();
    return chalk.gray(`[${now.toISOString()}]`);
  }

  /** Short label shown after the timestamp so you can scan for handoff vs vite vs next. */
  private static scopeTag(scope: LogScope): string {
    const tags: Record<LogScope, string> = {
      handoff: chalk.blue.bold('[handoff]'),
      vite: chalk.magenta.bold('[vite]'),
      next: chalk.green.bold('[next]'),
    };
    return tags[scope];
  }

  private static basePrefix(scope: LogScope): string {
    return `${this.getTimestamp()} ${this.scopeTag(scope)}`;
  }

  static log(message: string, scope: LogScope = 'handoff') {
    if (!this.scopeEnabled(scope) || !this.shouldEmit(1)) return;
    console.log(`${this.basePrefix(scope)} ${message}`);
  }

  /**
   * Vite often passes strings that already contain ANSI; avoid wrapping those in chalk.cyan so colors stay correct.
   */
  static info(message: string, scope: LogScope = 'handoff') {
    if (!this.scopeEnabled(scope) || !this.shouldEmit(1)) return;
    const body = scope === 'vite' ? message : chalk.cyan(message);
    console.log(`${this.basePrefix(scope)} ${body}`);
  }

  static success(message: string, scope: LogScope = 'handoff') {
    if (!this.scopeEnabled(scope) || !this.shouldEmit(1)) return;
    console.log(`${this.basePrefix(scope)} ${chalk.green(message)}`);
  }

  static warn(message: string, scope: LogScope = 'handoff') {
    if (!this.scopeEnabled(scope) || !this.shouldEmit(2)) return;
    const body = scope === 'vite' ? message : chalk.yellow(message);
    console.warn(`${this.basePrefix(scope)} ${body}`);
  }

  static error(message: string, error?: any, scope: LogScope = 'handoff') {
    if (!this.scopeEnabled(scope) || !this.shouldEmit(3)) return;
    const body = scope === 'vite' ? message : chalk.red(message);
    console.error(`${this.basePrefix(scope)} ${body}`);
    if (error) {
      console.error(error);
    }
  }

  static debug(message: string, data?: any) {
    if (this.severityThreshold >= 99) return;
    if (!this.scopeEnabled('handoff')) return;
    const allowDebug = this.debugMode || this.severityThreshold === 0;
    if (!allowDebug) return;
    console.log(`${this.basePrefix('handoff')} ${chalk.gray(`[DEBUG] ${message}`)}`);
    if (data) {
      console.log(data);
    }
  }

  /**
   * Log one line from a child process with timestamp + scope tag. Child ANSI is preserved (no extra chalk on the line).
   */
  static childProcessLine(line: string, scope: LogScope = 'next') {
    if (!this.scopeEnabled(scope) || !this.shouldEmit(1)) return;
    console.log(`${this.basePrefix(scope)} ${line}`);
  }

  /**
   * Pipe stdout/stderr from a spawned child through {@link childProcessLine}. Use with
   * `stdio: ['inherit' | 'ignore', 'pipe', 'pipe']`.
   */
  static pipeChildStreams(
    stdout: NodeJS.ReadableStream | null,
    stderr: NodeJS.ReadableStream | null,
    scope: LogScope = 'next'
  ) {
    for (const stream of [stdout, stderr]) {
      if (!stream) continue;
      const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
      rl.on('line', (line) => {
        this.childProcessLine(line, scope);
      });
    }
  }

  /** Forward a completed child-process buffer (e.g. from `spawn.sync` with stdio pipe) line-by-line. */
  static childProcessBuffer(buffer: Buffer | null | undefined, scope: LogScope = 'next') {
    if (!buffer?.length) return;
    const text = buffer.toString('utf8');
    for (const line of text.split(/\r?\n/)) {
      this.childProcessLine(line, scope);
    }
  }
}
