/** Human-readable duration for CLI build logs (ms under 1s, seconds with 2 decimals otherwise). */
export const formatDurationMs = (elapsedMs: number): string =>
  elapsedMs < 1000 ? `${Math.round(elapsedMs)}ms` : `${(elapsedMs / 1000).toFixed(2)}s`;
