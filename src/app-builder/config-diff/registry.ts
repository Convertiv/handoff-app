import Handoff from '../..';
import { patternDiffStrategy } from './strategies/pattern';
import { ConfigDiffStrategy, FinalizeContext } from './types';

const strategies = new Map<string, ConfigDiffStrategy>([
  [patternDiffStrategy.kind, patternDiffStrategy],
]);

export const getStrategy = (kind: string): ConfigDiffStrategy | undefined =>
  strategies.get(kind);

export const getAllStrategies = (): ConfigDiffStrategy[] =>
  Array.from(strategies.values());

/**
 * Runs every registered strategy finalizer.
 * Called after component rebuilds so derived artifacts stay up-to-date.
 */
export const runAllFinalizers = async (handoff: Handoff, context?: FinalizeContext): Promise<void> => {
  for (const strategy of Array.from(strategies.values())) {
    await strategy.finalize(handoff, context);
  }
};
