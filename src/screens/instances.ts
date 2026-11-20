import { assessArgs } from '../custom-previews/assess';
import type { ComponentContract } from '../custom-previews/contract';
import type { ComponentInstance } from './define';
import type { ArgsAssessment, ComponentInfo, InstanceAssessment, PatternInfo } from './types';

/**
 * Component instances: creating, expanding and checking them against the current component
 * contracts. Pure, so the canvas, the hooks and server tools agree.
 */

/** A new instance id. Random, so ids from two writers never collide. */
export const createInstanceId = (): string =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export interface CreateInstanceOptions {
  /** The args to start from, as given. Wins over `preview`. */
  args?: Record<string, unknown>;
  /** Start from this named preview's args, plus defaults for required properties. An unknown key starts from the default args. */
  preview?: string;
}

/**
 * A new instance of a component. Pass a `ComponentInfo` to start from its default args or one of
 * its previews; an id alone starts from empty args.
 */
export const createInstance = (
  component: (Pick<ComponentInfo, 'id' | 'defaultArgs'> & Partial<Pick<ComponentInfo, 'previews' | 'contract'>>) | string,
  options: CreateInstanceOptions = {}
): ComponentInstance => {
  if (typeof component === 'string') {
    return { id: createInstanceId(), componentId: component, args: structuredClone(options.args ?? {}) };
  }
  const preview = options.preview ? component.previews?.find((candidate) => candidate.key === options.preview) : undefined;
  const args = options.args ?? (preview ? assessComponentArgs(component.contract, preview.args).args : component.defaultArgs);
  return { id: createInstanceId(), componentId: component.id, args: structuredClone(args ?? {}) };
};

/** A pattern as the instances it is made of, each with a new id. */
export const expandPattern = (pattern: Pick<PatternInfo, 'components'>): ComponentInstance[] =>
  pattern.components.map((entry) => createInstance(entry.componentId, { args: entry.args }));

/** Args checked against a component's current contract, with defaults filled in for rendering. */
export const assessComponentArgs = (contract: ComponentContract | undefined, args: Record<string, unknown>): ArgsAssessment => {
  const { issues, renderArgs } = assessArgs(contract, args ?? {});
  return { args: renderArgs, issues };
};

/**
 * One instance against its component. A component that changed or disappeared reports issues;
 * the stored instance is never changed or rejected.
 */
export const assessInstance = (instance: ComponentInstance, component: Pick<ComponentInfo, 'contract'> | null): InstanceAssessment => {
  if (!component) {
    return {
      status: 'missing-component',
      issues: [{ code: 'unknown-property', path: '', message: `Component "${instance.componentId}" does not exist.` }],
    };
  }
  const { issues } = assessComponentArgs(component.contract, instance.args);
  return { status: issues.length ? 'needs-attention' : 'ok', issues };
};

/** Insert items after the item with `afterId`, or at the end when it is absent. */
export const insertAfter = <T extends { id: string }>(list: T[], items: T | T[], afterId?: string | null): T[] => {
  const added = Array.isArray(items) ? items : [items];
  const index = afterId ? list.findIndex((item) => item.id === afterId) : -1;
  return index < 0 ? [...list, ...added] : [...list.slice(0, index + 1), ...added, ...list.slice(index + 1)];
};

/** Move the item with `id` to `position` (clamped), keeping the others in order. */
export const moveTo = <T extends { id: string }>(list: T[], id: string, position: number): T[] => {
  const index = list.findIndex((item) => item.id === id);
  if (index < 0) return list;
  const rest = list.filter((item) => item.id !== id);
  const target = Math.max(0, Math.min(rest.length, Math.trunc(position)));
  return [...rest.slice(0, target), list[index], ...rest.slice(target)];
};
