import { LogOptions, Logger as ViteLogger } from 'vite';
import { Logger } from '../../utils/logger';

export const createViteLogger = (): ViteLogger => {
  const warnedMessages = new Set<string>();

  return {
    hasWarned: false,
    info(msg: string, options?: LogOptions) {
      Logger.info(msg);
    },
    warn(msg: string, options?: LogOptions) {
      this.hasWarned = true;
      Logger.warn(msg);
    },
    warnOnce(msg: string, options?: LogOptions) {
      if (warnedMessages.has(msg)) return;
      warnedMessages.add(msg);
      this.hasWarned = true;
      Logger.warn(msg);
    },
    error(msg: string, options?: LogOptions) {
      Logger.error(msg);
    },
    clearScreen(type: string) {
      // No-op to preserve terminal history
    },
    hasErrorLogged(error: Error) {
      return false;
    },
  };
};

