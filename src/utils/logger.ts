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
}

