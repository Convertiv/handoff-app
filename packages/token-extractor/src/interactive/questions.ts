import inquirer from 'inquirer';
import chalk from 'chalk';
import type { ExtractedToken, TokenSet } from '../types/tokens';

// Types for ambiguity detection
export type AmbiguityType =
  | 'duplicate-value'
  | 'similar-colors'
  | 'inconsistent-naming'
  | 'incomplete-scale';

export interface Ambiguity {
  type: AmbiguityType;
  message: string;
  tokens: ExtractedToken[];
  value?: string;
  patterns?: string[];
  category?: string;
}

export interface QuestionOptions {
  interactive?: boolean;
}

/**
 * Detect ambiguities in extracted tokens
 */
export function detectAmbiguities(tokens: ExtractedToken[]): Ambiguity[] {
  const ambiguities: Ambiguity[] = [];

  // Detect duplicate values with different names
  const duplicates = detectDuplicateValues(tokens);
  ambiguities.push(...duplicates);

  // Detect similar colors
  const similarColors = detectSimilarColors(tokens);
  ambiguities.push(...similarColors);

  // Detect inconsistent naming patterns
  const inconsistentNaming = detectInconsistentNaming(tokens);
  ambiguities.push(...inconsistentNaming);

  // Detect incomplete scales
  const incompleteScales = detectIncompleteScales(tokens);
  ambiguities.push(...incompleteScales);

  return ambiguities;
}

/**
 * Detect duplicate values with different names
 */
function detectDuplicateValues(tokens: ExtractedToken[]): Ambiguity[] {
  const ambiguities: Ambiguity[] = [];
  const valueMap = new Map<string, ExtractedToken[]>();

  // Group tokens by value
  tokens.forEach(token => {
    const key = `${token.type}:${token.value}`;
    if (!valueMap.has(key)) {
      valueMap.set(key, []);
    }
    valueMap.get(key)!.push(token);
  });

  // Find duplicates (same value, different names)
  valueMap.forEach((group, key) => {
    if (group.length > 1) {
      const uniqueNames = new Set(group.map(t => t.name));
      if (uniqueNames.size > 1) {
        const [type, value] = key.split(':');
        ambiguities.push({
          type: 'duplicate-value',
          value: value,
          tokens: group,
          message: `Found ${value} used in ${group.length} places with different names: ${Array.from(uniqueNames).join(', ')}`
        });
      }
    }
  });

  return ambiguities;
}

/**
 * Detect similar colors (within a threshold)
 */
function detectSimilarColors(tokens: ExtractedToken[]): Ambiguity[] {
  const ambiguities: Ambiguity[] = [];
  const colorTokens = tokens.filter(t => t.type === 'color');

  // Group colors by similarity
  const groups: ExtractedToken[][] = [];
  const processed = new Set<number>();

  for (let i = 0; i < colorTokens.length; i++) {
    if (processed.has(i)) continue;

    const group: ExtractedToken[] = [colorTokens[i]];
    processed.add(i);

    for (let j = i + 1; j < colorTokens.length; j++) {
      if (processed.has(j)) continue;

      if (areColorsSimilar(colorTokens[i].value, colorTokens[j].value)) {
        group.push(colorTokens[j]);
        processed.add(j);
      }
    }

    // If we found a group of similar colors
    if (group.length >= 3) {
      const colorName = extractColorName(group[0].name);
      ambiguities.push({
        type: 'similar-colors',
        tokens: group,
        message: `Found ${group.length} similar ${colorName} colors: ${group.map(t => t.name).join(', ')}`
      });
    }
  }

  return ambiguities;
}

/**
 * Detect inconsistent naming patterns
 */
function detectInconsistentNaming(tokens: ExtractedToken[]): Ambiguity[] {
  const ambiguities: Ambiguity[] = [];

  // Group tokens by category
  const categories = new Map<string, ExtractedToken[]>();
  tokens.forEach(token => {
    if (!categories.has(token.type)) {
      categories.set(token.type, []);
    }
    categories.get(token.type)!.push(token);
  });

  // Check each category for inconsistent naming
  categories.forEach((group, category) => {
    if (group.length < 3) return; // Need at least 3 tokens to detect pattern

    const patterns = detectNamingPatterns(group);

    if (patterns.size > 1) {
      ambiguities.push({
        type: 'inconsistent-naming',
        category,
        patterns: Array.from(patterns),
        tokens: group,
        message: `${category.charAt(0).toUpperCase() + category.slice(1)} tokens use mixed naming conventions: ${Array.from(patterns).join(', ')}`
      });
    }
  });

  return ambiguities;
}

/**
 * Detect incomplete scales (missing values in a sequence)
 */
function detectIncompleteScales(tokens: ExtractedToken[]): Ambiguity[] {
  const ambiguities: Ambiguity[] = [];

  // Group tokens by type
  const categories = new Map<string, ExtractedToken[]>();
  tokens.forEach(token => {
    if (token.type === 'spacing' || token.type === 'sizing') {
      if (!categories.has(token.type)) {
        categories.set(token.type, []);
      }
      categories.get(token.type)!.push(token);
    }
  });

  categories.forEach((group, category) => {
    if (group.length < 4) return;

    // Extract numeric values
    const values = group
      .map(t => parseFloat(String(t.value)))
      .filter(v => !isNaN(v))
      .sort((a, b) => a - b);

    if (values.length < 4) return;

    // Check if values follow a pattern (4, 8, 16, 32, etc.)
    const gaps: number[] = [];
    for (let i = 1; i < values.length; i++) {
      gaps.push(values[i] - values[i - 1]);
    }

    // Detect if there are large gaps that suggest missing values
    const minGap = Math.min(...gaps);
    const maxGap = Math.max(...gaps);

    // If the largest gap is more than 2x the smallest gap, likely missing values
    const hasLargeGap = maxGap > minGap * 2.5;

    if (hasLargeGap) {
      ambiguities.push({
        type: 'incomplete-scale',
        category,
        tokens: group,
        message: `${category.charAt(0).toUpperCase() + category.slice(1)} scale may be incomplete (values: ${values.join(', ')})`
      });
    }
  });

  return ambiguities;
}

/**
 * Generate inquirer questions from ambiguities
 */
export function generateQuestions(ambiguities: Ambiguity[]): any[] {
  const questions: any[] = [];

  // Limit to top 10 most important ambiguities
  const limitedAmbiguities = ambiguities.slice(0, 10);

  limitedAmbiguities.forEach((ambiguity, index) => {
    switch (ambiguity.type) {
      case 'duplicate-value':
        questions.push(generateDuplicateValueQuestion(ambiguity, index));
        break;
      case 'similar-colors':
        questions.push(generateSimilarColorsQuestion(ambiguity, index));
        break;
      case 'inconsistent-naming':
        questions.push(generateInconsistentNamingQuestion(ambiguity, index));
        break;
      case 'incomplete-scale':
        // Don't ask about incomplete scales, just note them
        break;
    }
  });

  return questions;
}

/**
 * Generate question for duplicate value
 */
function generateDuplicateValueQuestion(ambiguity: Ambiguity, index: number): any {
  const choices = ambiguity.tokens.map(token => ({
    name: `${token.name} (from ${token.file})`,
    value: token.name
  }));

  return {
    type: 'list',
    name: `ambiguity-${index}`,
    message: `Found ${ambiguity.value} used in ${ambiguity.tokens.length} places. What should we call this ${ambiguity.tokens[0].type}?`,
    choices
  };
}

/**
 * Generate question for similar colors
 */
function generateSimilarColorsQuestion(ambiguity: Ambiguity, index: number): any {
  const colorName = extractColorName(ambiguity.tokens[0].name);

  return {
    type: 'list',
    name: `ambiguity-${index}`,
    message: `Found ${ambiguity.tokens.length} similar ${colorName} colors. How should we organize them?`,
    choices: [
      {
        name: `Group as shades of '${colorName}' (e.g., ${colorName}-100, ${colorName}-200)`,
        value: `group-shades:${colorName}`
      },
      {
        name: 'Keep separate with current names',
        value: 'keep-separate'
      },
      {
        name: 'Merge into single color (use most common)',
        value: 'merge'
      }
    ]
  };
}

/**
 * Generate question for inconsistent naming
 */
function generateInconsistentNamingQuestion(ambiguity: Ambiguity, index: number): any {
  const patterns = ambiguity.patterns || [];

  return {
    type: 'list',
    name: `ambiguity-${index}`,
    message: `${ambiguity.category} tokens use mixed naming conventions. Which convention should we use?`,
    choices: patterns.map(pattern => ({
      name: pattern === 't-shirt'
        ? 'T-shirt sizes (xs, sm, md, lg, xl)'
        : pattern === 'numeric'
        ? 'Numeric scale (100, 200, 300, ...)'
        : `${pattern.charAt(0).toUpperCase() + pattern.slice(1)} convention`,
      value: pattern
    }))
  };
}

/**
 * Apply user answers to refine tokens
 */
export function applyAnswers(tokens: ExtractedToken[], answers: Record<string, string>): ExtractedToken[] {
  let refined = [...tokens];

  Object.entries(answers).forEach(([questionId, answer]) => {
    if (!answer) return;

    // Extract ambiguity index from question ID
    const match = questionId.match(/ambiguity-(\d+)/);
    if (!match) return;

    // Apply the transformation based on answer type
    if (answer.startsWith('group-shades:')) {
      const baseName = answer.replace('group-shades:', '');
      refined = groupAsShades(refined, baseName);
    } else if (answer === 'merge') {
      refined = mergeSimilarColors(refined);
    } else if (answer === 'keep-separate') {
      // No change needed
    } else if (answer === 'numeric' || answer === 't-shirt') {
      refined = renameByConvention(refined, answer);
    } else {
      // Assume it's a token name to consolidate to
      refined = consolidateDuplicates(refined, answer);
    }
  });

  return refined;
}

/**
 * Ask clarifying questions interactively
 */
export async function askClarifyingQuestions(
  tokenSet: TokenSet,
  options: QuestionOptions = {}
): Promise<TokenSet> {
  const { interactive = true } = options;

  if (!interactive) {
    return tokenSet;
  }

  // Detect ambiguities
  const ambiguities = detectAmbiguities(tokenSet.tokens);

  if (ambiguities.length === 0) {
    console.log(chalk.green('\n✓ No ambiguities detected'));
    return tokenSet;
  }

  console.log(chalk.cyan(`\n🤔 Found ${ambiguities.length} potential ambiguities`));
  console.log(chalk.gray('Let\'s clarify a few things to improve token quality...\n'));

  // Generate questions
  const questions = generateQuestions(ambiguities);

  if (questions.length === 0) {
    return tokenSet;
  }

  // Ask questions
  const answers = await inquirer.prompt(questions);

  // Apply answers
  const refinedTokens = applyAnswers(tokenSet.tokens, answers);

  console.log(chalk.green('\n✓ Tokens refined based on your input'));

  return {
    ...tokenSet,
    tokens: refinedTokens
  };
}

// Helper functions

function areColorsSimilar(color1: any, color2: any): boolean {
  // Simple color similarity check using hex values
  const hex1 = String(color1).replace('#', '');
  const hex2 = String(color2).replace('#', '');

  if (hex1.length !== 6 || hex2.length !== 6) return false;

  const r1 = parseInt(hex1.substring(0, 2), 16);
  const g1 = parseInt(hex1.substring(2, 4), 16);
  const b1 = parseInt(hex1.substring(4, 6), 16);

  const r2 = parseInt(hex2.substring(0, 2), 16);
  const g2 = parseInt(hex2.substring(2, 4), 16);
  const b2 = parseInt(hex2.substring(4, 6), 16);

  // Calculate Euclidean distance in RGB space
  const distance = Math.sqrt(
    Math.pow(r1 - r2, 2) +
    Math.pow(g1 - g2, 2) +
    Math.pow(b1 - b2, 2)
  );

  // Similar if distance is less than 30 (out of max ~442)
  return distance < 30;
}

function extractColorName(tokenName: string): string {
  // Extract base color name (e.g., 'blue' from 'blue-100', 'primary-blue', etc.)
  const match = tokenName.match(/([a-z]+)/i);
  return match ? match[0] : 'color';
}

function detectNamingPatterns(tokens: ExtractedToken[]): Set<string> {
  const patterns = new Set<string>();

  tokens.forEach(token => {
    const name = token.name.toLowerCase();

    if (/-(xs|sm|md|lg|xl)/.test(name)) {
      patterns.add('t-shirt');
    } else if (/-(100|200|300|400|500|600|700|800|900)/.test(name)) {
      patterns.add('numeric');
    } else if (/-(light|medium|dark)/.test(name)) {
      patterns.add('descriptive');
    } else if (/-(1|2|3|4|5|6|7|8|9)$/.test(name)) {
      patterns.add('sequential');
    }
  });

  return patterns;
}

function groupAsShades(tokens: ExtractedToken[], baseName: string): ExtractedToken[] {
  // Find tokens that should be grouped
  const targetTokens = tokens.filter(t =>
    t.name.toLowerCase().includes(baseName.toLowerCase())
  );

  if (targetTokens.length === 0) return tokens;

  // Sort by value (assuming numeric or hex)
  const sorted = [...targetTokens].sort((a, b) => {
    const aVal = String(a.value);
    const bVal = String(b.value);
    return aVal.localeCompare(bVal);
  });

  // Assign shade numbers
  const result = tokens.map(token => {
    const index = sorted.findIndex(t => t.name === token.name && t.value === token.value);
    if (index >= 0) {
      const shadeNumber = (index + 1) * 100;
      return {
        ...token,
        name: `${baseName}-${shadeNumber}`
      };
    }
    return token;
  });

  return result;
}

function mergeSimilarColors(tokens: ExtractedToken[]): ExtractedToken[] {
  // Find most common color name in similar groups
  // For now, just return as-is (would need more context to merge properly)
  return tokens;
}

function renameByConvention(tokens: ExtractedToken[], convention: string): ExtractedToken[] {
  if (convention === 'numeric') {
    // Convert to numeric scale (100, 200, 300, etc.)
    const sorted = [...tokens].sort((a, b) => {
      const aVal = parseFloat(String(a.value));
      const bVal = parseFloat(String(b.value));
      return aVal - bVal;
    });

    return tokens.map(token => {
      const index = sorted.findIndex(t => t.name === token.name);
      if (index >= 0) {
        const prefix = token.type;
        return {
          ...token,
          name: `${prefix}-${(index + 1) * 100}`
        };
      }
      return token;
    });
  } else if (convention === 't-shirt') {
    // Convert to t-shirt sizes
    const sizes = ['xs', 'sm', 'md', 'lg', 'xl'];
    const sorted = [...tokens].sort((a, b) => {
      const aVal = parseFloat(String(a.value));
      const bVal = parseFloat(String(b.value));
      return aVal - bVal;
    });

    return tokens.map(token => {
      const index = sorted.findIndex(t => t.name === token.name);
      if (index >= 0 && index < sizes.length) {
        const prefix = token.type;
        return {
          ...token,
          name: `${prefix}-${sizes[index]}`
        };
      }
      return token;
    });
  }

  return tokens;
}

function consolidateDuplicates(tokens: ExtractedToken[], targetName: string): ExtractedToken[] {
  // Find the target token to use as reference
  const target = tokens.find(t => t.name === targetName);
  if (!target) return tokens;

  // Replace all tokens with the same value with the target name
  return tokens.map(token => {
    if (token.value === target.value && token.type === target.type) {
      return {
        ...token,
        name: targetName
      };
    }
    return token;
  });
}
