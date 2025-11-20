import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import type { ExtractedToken } from '../types/tokens';

const execAsync = promisify(exec);

/**
 * Location where a token was found
 */
export interface TokenLocation {
  file: string;
  line: number;
  context: string; // Line of code
}

/**
 * Token that's used but not defined
 */
export interface UndefinedToken {
  token: string;
  usageCount: number;
  locations: TokenLocation[];
  suggestedAction?: string;
}

/**
 * Token that's defined but never used
 */
export interface OrphanedToken {
  token: string;
  definedIn: TokenLocation;
  recommendation: 'remove' | 'document' | 'review';
}

/**
 * Naming inconsistency between tokens
 */
export interface NamingInconsistency {
  tokens: string[];
  issue: 'case-mismatch' | 'prefix-mismatch' | 'format-mismatch';
  suggestion: string;
}

/**
 * Complete health report
 */
export interface HealthReport {
  undefinedTokens: UndefinedToken[];
  orphanedTokens: OrphanedToken[];
  namingInconsistencies: NamingInconsistency[];
  summary: {
    totalTokensExtracted: number;
    definitions: number;
    references: number;
    undefinedCount: number;
    orphanedCount: number;
    healthScore: number; // 0-100
  };
}

/**
 * Analyze design system health from extracted tokens
 */
export async function analyzeDesignSystemHealth(
  extractedTokens: ExtractedToken[],
  projectPath: string
): Promise<HealthReport> {
  console.log('🔍 Analyzing design system health...');

  // Categorize tokens as definitions or references
  const { definitions, references } = categorizeTokens(extractedTokens);

  console.log(`  Found ${definitions.length} definitions and ${references.length} references`);

  // Find undefined token references
  const undefinedTokens = await findUndefinedTokens(
    definitions,
    references,
    projectPath
  );

  // Find orphaned token definitions
  const orphanedTokens = findOrphanedTokens(definitions, references);

  // Find naming inconsistencies
  const namingInconsistencies = findNamingInconsistencies(extractedTokens);

  // Calculate health score
  const healthScore = calculateHealthScore(
    definitions.length,
    undefinedTokens.length,
    orphanedTokens.length
  );

  return {
    undefinedTokens,
    orphanedTokens,
    namingInconsistencies,
    summary: {
      totalTokensExtracted: extractedTokens.length,
      definitions: definitions.length,
      references: references.length,
      undefinedCount: undefinedTokens.length,
      orphanedCount: orphanedTokens.length,
      healthScore,
    },
  };
}

/**
 * Categorize tokens as definitions or references based on context
 */
function categorizeTokens(tokens: ExtractedToken[]): {
  definitions: ExtractedToken[];
  references: ExtractedToken[];
} {
  const definitions: ExtractedToken[] = [];
  const references: ExtractedToken[] = [];

  for (const token of tokens) {
    // Heuristics to determine if it's a definition or reference:
    // 1. If context explicitly says "definition" or "declaration"
    // 2. If it has a concrete value (not a reference like "$other-token")
    // 3. If it's in a known definition file (globals.css, theme files, etc.)

    const isDefinition =
      token.context?.toLowerCase().includes('definition') ||
      token.context?.toLowerCase().includes('declaration') ||
      token.context?.toLowerCase().includes('variable') ||
      (token.value && typeof token.value === 'string' && !token.value.startsWith('$') && !token.value.startsWith('{'));

    if (isDefinition) {
      definitions.push(token);
    } else {
      references.push(token);
    }
  }

  return { definitions, references };
}

/**
 * Find tokens that are referenced but not defined
 */
async function findUndefinedTokens(
  definitions: ExtractedToken[],
  references: ExtractedToken[],
  projectPath: string
): Promise<UndefinedToken[]> {
  const undefinedMap = new Map<string, UndefinedToken>();

  for (const ref of references) {
    // Check if this reference has a matching definition
    const isDefined = definitions.some((def) =>
      tokensMatch(def.name, ref.name)
    );

    if (!isDefined) {
      const normalizedName = normalizeTokenName(ref.name);

      if (!undefinedMap.has(normalizedName)) {
        undefinedMap.set(normalizedName, {
          token: ref.name,
          usageCount: 0,
          locations: [],
          suggestedAction: generateSuggestion(ref.name, ref.type),
        });
      }

      const undefined = undefinedMap.get(normalizedName)!;
      undefined.usageCount++;
      undefined.locations.push({
        file: ref.file,
        line: ref.line || 0,
        context: '', // Will be filled by grep
      });
    }
  }

  // Use grep to find all actual locations and context
  for (const [, undefinedToken] of undefinedMap) {
    await findTokenLocations(undefinedToken, projectPath);
  }

  return Array.from(undefinedMap.values()).sort(
    (a, b) => b.usageCount - a.usageCount
  );
}

/**
 * Find tokens that are defined but never used
 */
function findOrphanedTokens(
  definitions: ExtractedToken[],
  references: ExtractedToken[]
): OrphanedToken[] {
  const orphaned: OrphanedToken[] = [];

  for (const def of definitions) {
    // Check if this definition is referenced anywhere
    const isUsed = references.some((ref) =>
      tokensMatch(def.name, ref.name)
    );

    if (!isUsed) {
      orphaned.push({
        token: def.name,
        definedIn: {
          file: def.file,
          line: def.line || 0,
          context: def.context || '',
        },
        recommendation: getOrphanedRecommendation(def.name),
      });
    }
  }

  return orphaned;
}

/**
 * Find naming inconsistencies
 */
function findNamingInconsistencies(
  tokens: ExtractedToken[]
): NamingInconsistency[] {
  const inconsistencies: NamingInconsistency[] = [];
  const tokensByNormalizedName = new Map<string, ExtractedToken[]>();

  // Group tokens by normalized name
  for (const token of tokens) {
    const normalized = normalizeTokenName(token.name);
    if (!tokensByNormalizedName.has(normalized)) {
      tokensByNormalizedName.set(normalized, []);
    }
    tokensByNormalizedName.get(normalized)!.push(token);
  }

  // Find groups with multiple naming variations
  for (const [normalized, group] of tokensByNormalizedName) {
    if (group.length > 1) {
      const uniqueNames = [...new Set(group.map((t) => t.name))];
      if (uniqueNames.length > 1) {
        inconsistencies.push({
          tokens: uniqueNames,
          issue: detectInconsistencyType(uniqueNames),
          suggestion: generateNamingSuggestion(uniqueNames),
        });
      }
    }
  }

  return inconsistencies;
}

/**
 * Use grep to find actual locations of a token in the codebase
 */
async function findTokenLocations(
  undefinedToken: UndefinedToken,
  projectPath: string
): Promise<void> {
  try {
    // Escape special characters for grep
    const escapedToken = undefinedToken.token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const { stdout } = await execAsync(
      `grep -rn "${escapedToken}" "${projectPath}" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.css" --include="*.scss" --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=dist 2>/dev/null || true`
    );

    const lines = stdout.trim().split('\n').filter((line) => line);
    undefinedToken.locations = lines.slice(0, 10).map((line) => {
      const match = line.match(/^(.+?):(\d+):(.+)$/);
      if (match) {
        return {
          file: path.relative(projectPath, match[1]),
          line: parseInt(match[2], 10),
          context: match[3].trim(),
        };
      }
      return {
        file: '',
        line: 0,
        context: line,
      };
    });

    undefinedToken.usageCount = lines.length;
  } catch (error) {
    // Grep failed, keep existing location info
    console.warn(`Failed to grep for ${undefinedToken.token}`);
  }
}

/**
 * Check if two token names match (accounting for different formats)
 */
function tokensMatch(name1: string, name2: string): boolean {
  return normalizeTokenName(name1) === normalizeTokenName(name2);
}

/**
 * Normalize token name for comparison
 */
function normalizeTokenName(name: string): string {
  return name
    .toLowerCase()
    .replace(/^(\$|--|\{|\})/, '') // Remove prefixes/wrappers
    .replace(/\}/g, '')
    .replace(/-/g, '')
    .replace(/_/g, '')
    .replace(/\./g, '');
}

/**
 * Generate suggestion for undefined token
 */
function generateSuggestion(tokenName: string, tokenType: string): string {
  if (tokenName.startsWith('$')) {
    return `Add SCSS variable: $${tokenName.slice(1)}: <value>;`;
  } else if (tokenName.startsWith('--')) {
    return `Add CSS custom property to globals.css:\n  ${tokenName}: <value>;`;
  } else {
    return `Define this ${tokenType} token in your design system`;
  }
}

/**
 * Get recommendation for orphaned token
 */
function getOrphanedRecommendation(
  tokenName: string
): 'remove' | 'document' | 'review' {
  // If it's a chart or special color, might be intentional
  if (tokenName.includes('chart') || tokenName.includes('radix')) {
    return 'document';
  }
  return 'remove';
}

/**
 * Detect type of naming inconsistency
 */
function detectInconsistencyType(
  names: string[]
): 'case-mismatch' | 'prefix-mismatch' | 'format-mismatch' {
  const prefixes = names.map((n) => n.match(/^(\$|--)/)?.[1] || '');
  if (new Set(prefixes).size > 1) {
    return 'prefix-mismatch';
  }

  const cases = names.map((n) =>
    n === n.toLowerCase() ? 'lower' : n === n.toUpperCase() ? 'upper' : 'mixed'
  );
  if (new Set(cases).size > 1) {
    return 'case-mismatch';
  }

  return 'format-mismatch';
}

/**
 * Generate naming suggestion
 */
function generateNamingSuggestion(names: string[]): string {
  // Pick the most common format
  const withDashes = names.filter((n) => n.includes('-')).length;
  const withUnderscores = names.filter((n) => n.includes('_')).length;
  const withDots = names.filter((n) => n.includes('.')).length;

  if (withDashes > withUnderscores && withDashes > withDots) {
    return `Standardize on kebab-case: ${names[0]
      .replace(/_/g, '-')
      .toLowerCase()}`;
  } else if (withDots > withDashes && withDots > withUnderscores) {
    return `Standardize on dot notation: ${names[0]
      .replace(/-/g, '.')
      .replace(/_/g, '.')
      .toLowerCase()}`;
  } else {
    return `Standardize naming format across all tokens`;
  }
}

/**
 * Calculate health score (0-100)
 */
function calculateHealthScore(
  definitionsCount: number,
  undefinedCount: number,
  orphanedCount: number
): number {
  if (definitionsCount === 0) return 0;

  const undefinedPenalty = (undefinedCount / (definitionsCount + undefinedCount)) * 50;
  const orphanedPenalty = (orphanedCount / definitionsCount) * 30;

  return Math.max(0, Math.round(100 - undefinedPenalty - orphanedPenalty));
}
