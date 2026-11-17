import { Logger } from '../../utils/logger';

/**
 * Logs a failed component build step with what a reader acts on: the error message and, for a Vite or
 * Rollup error, its code frame. The stack trace points into the bundler, so it goes to debug output.
 */
export const logBuildError = (summary: string, error: unknown): void => {
  const { message, frame, stack } = (error ?? {}) as { message?: string; frame?: string; stack?: string };
  Logger.error(`${summary}: ${message ?? String(error)}${frame ? `\n${frame}` : ''}`);
  if (stack) Logger.debug(stack);
};
