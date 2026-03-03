import { BulkComponentEntry } from '../PlaygroundContext';
import { PlaygroundComponent } from '../types';

export interface ParsedWizardResult {
  entries: BulkComponentEntry[];
  warnings: string[];
}

export interface ProposedComponent {
  componentId: string;
  data: Record<string, any>;
}

/**
 * Parse and validate the LLM JSON response, matching component IDs against
 * the loaded catalog. Returns valid entries and warnings for any issues.
 */
export function parseWizardResponse(
  raw: string,
  catalog: PlaygroundComponent[]
): ParsedWizardResult {
  const warnings: string[] = [];
  const catalogIds = new Set(catalog.map((c) => c.id));

  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { entries: [], warnings: ['Failed to parse LLM response as JSON.'] };
  }

  let components: any[] = [];
  if (Array.isArray(parsed)) {
    components = parsed;
  } else if (parsed?.components && Array.isArray(parsed.components)) {
    components = parsed.components;
  } else {
    return { entries: [], warnings: ['LLM response did not contain a "components" array.'] };
  }

  const entries: BulkComponentEntry[] = [];
  for (let i = 0; i < components.length; i++) {
    const item = components[i];
    if (!item?.componentId || typeof item.componentId !== 'string') {
      warnings.push(`Item ${i + 1}: missing or invalid "componentId", skipped.`);
      continue;
    }
    if (!catalogIds.has(item.componentId)) {
      warnings.push(`Item ${i + 1}: component "${item.componentId}" not found in your design system, skipped.`);
      continue;
    }
    entries.push({
      componentId: item.componentId,
      data: item.data && typeof item.data === 'object' ? item.data : {},
    });
  }

  if (entries.length === 0 && warnings.length === 0) {
    warnings.push('LLM returned an empty component list.');
  }

  return { entries, warnings };
}

/**
 * Enrich parsed entries with component titles for the review UI.
 */
export function enrichWithTitles(
  entries: BulkComponentEntry[],
  catalog: PlaygroundComponent[]
): Array<BulkComponentEntry & { title: string; description: string }> {
  const catalogMap = new Map(catalog.map((c) => [c.id, c]));
  return entries.map((entry) => {
    const comp = catalogMap.get(entry.componentId);
    return {
      ...entry,
      title: comp?.title || entry.componentId,
      description: comp?.description || '',
    };
  });
}
