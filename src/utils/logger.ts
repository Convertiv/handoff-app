import readline from 'readline';

import chalk from 'chalk';

/** Logical source of a log line — used for a fixed-width–style colored tag after the timestamp. */
export type LogScope = 'handoff' | 'vite' | 'next';

export class Logger {
  private static debugMode = false;

  static init(options?: { debug?: boolean }) {
    if (options?.debug !== undefined) {
      this.debugMode = options.debug;
    }
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
    console.log(`${this.basePrefix(scope)} ${message}`);
  }

  /**
   * Vite often passes strings that already contain ANSI; avoid wrapping those in chalk.cyan so colors stay correct.
   */
  static info(message: string, scope: LogScope = 'handoff') {
    const body = scope === 'vite' ? message : chalk.cyan(message);
    console.log(`${this.basePrefix(scope)} ${body}`);
  }

  static success(message: string, scope: LogScope = 'handoff') {
    console.log(`${this.basePrefix(scope)} ${chalk.green(message)}`);
  }

  static warn(message: string, scope: LogScope = 'handoff') {
    const body = scope === 'vite' ? message : chalk.yellow(message);
    console.warn(`${this.basePrefix(scope)} ${body}`);
  }

  static error(message: string, error?: any, scope: LogScope = 'handoff') {
    const body = scope === 'vite' ? message : chalk.red(message);
    console.error(`${this.basePrefix(scope)} ${body}`);
    if (error) {
      console.error(error);
    }
  }

  static debug(message: string, data?: any) {
    if (this.debugMode) {
      console.log(`${this.basePrefix('handoff')} ${chalk.gray(`[DEBUG] ${message}`)}`);
      if (data) {
        console.log(data);
      }
    }
  }

  /**
   * Log one line from a child process with timestamp + scope tag. Child ANSI is preserved (no extra chalk on the line).
   */
  static childProcessLine(line: string, scope: LogScope = 'next') {
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
