import readline from 'readline';

import chalk from 'chalk';

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

  static log(message: string) {
    console.log(`${this.getTimestamp()} ${message}`);
  }

  static info(message: string) {
    console.log(`${this.getTimestamp()} ${chalk.cyan(message)}`);
  }

  static success(message: string) {
    console.log(`${this.getTimestamp()} ${chalk.green(message)}`);
  }

  static warn(message: string) {
    console.warn(`${this.getTimestamp()} ${chalk.yellow(message)}`);
  }

  static error(message: string, error?: any) {
    console.error(`${this.getTimestamp()} ${chalk.red(message)}`);
    if (error) {
      console.error(error);
    }
  }

  static debug(message: string, data?: any) {
    if (this.debugMode) {
      console.log(`${this.getTimestamp()} ${chalk.gray(`[DEBUG] ${message}`)}`);
      if (data) {
        console.log(data);
      }
    }
  }

  /**
   * Log one line from a child process (e.g. Next.js) with the same timestamp prefix as other
   * Handoff logs. Does not wrap the line in chalk so ANSI styling from the child is preserved.
   */
  static childProcessLine(line: string) {
    console.log(`${this.getTimestamp()} ${line}`);
  }

  /**
   * Pipe stdout/stderr from a spawned child through {@link childProcessLine} so output matches
   * Handoff log formatting. Use with `stdio: ['inherit' | 'ignore', 'pipe', 'pipe']`.
   */
  static pipeChildStreams(stdout: NodeJS.ReadableStream | null, stderr: NodeJS.ReadableStream | null) {
    for (const stream of [stdout, stderr]) {
      if (!stream) continue;
      const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
      rl.on('line', (line) => {
        this.childProcessLine(line);
      });
    }
  }

  /** Forward a completed child-process buffer (e.g. from `spawn.sync` with stdio pipe) line-by-line. */
  static childProcessBuffer(buffer: Buffer | null | undefined) {
    if (!buffer?.length) return;
    const text = buffer.toString('utf8');
    for (const line of text.split(/\r?\n/)) {
      this.childProcessLine(line);
    }
  }
}

