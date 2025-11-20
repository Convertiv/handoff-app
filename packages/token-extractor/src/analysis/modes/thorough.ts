import type { AIProvider } from '../ai-client';
import type { ExtractedToken, TokenSet } from '../../types/tokens';
import * as fs from 'fs';

/**
 * Progress callback type
 */
export type ProgressCallback = (message: string) => void;

/**
 * Intermediate results from Pass 1
 */
interface Pass1Result {
  files: Array<{
    file: string;
    tokens: Array<{
      name: string;
      value: string | number;
      type: string;
      line?: number;
      context?: string;
    }>;
  }>;
}

/**
 * Intermediate results from Pass 2
 */
interface Pass2Result {
  patterns: Array<{
    value: string | number;
    occurrences: number;
    files: string[];
    suggestedName?: string;
  }>;
  duplicates: Array<{
    value: string | number;
    names: string[];
    consolidatedName: string;
  }>;
}

/**
 * Intermediate results from Pass 3
 */
interface Pass3Result {
  groups: {
    core: Record<string, ExtractedToken[]>;
    semantic: Record<string, ExtractedToken[]>;
    component: Record<string, ExtractedToken[]>;
  };
}

/**
 * Final results from Pass 4
 */
interface Pass4Result {
  tokens: ExtractedToken[];
  aliases: Array<{
    alias: string;
    references: string;
    reasoning?: string;
  }>;
}

/**
 * Thorough Mode: 4-pass AI-powered analysis pipeline
 *
 * Strategy:
 * - Pass 1: Analyze each file individually, extract all potential tokens with context
 * - Pass 2: Compare tokens across files, find duplicates and patterns
 * - Pass 3: Group tokens semantically (core/semantic/component hierarchy)
 * - Pass 4: Create aliases between related tokens (e.g., $colors.primary → $colors.blue.500)
 *
 * This mode provides the highest accuracy and most comprehensive analysis,
 * but requires 4 separate AI calls and is more expensive.
 */
export class ThoroughMode {
  private aiProvider: AIProvider;
  private readonly DELAY_BETWEEN_PASSES = 3000; // 3 seconds delay between passes

  constructor(aiProvider: AIProvider) {
    this.aiProvider = aiProvider;
  }

  /**
   * Extract tokens using 4-pass pipeline
   *
   * @param files - Array of file paths to analyze
   * @param onProgress - Optional callback for progress updates
   * @returns TokenSet with extracted tokens and metadata
   */
  async extract(files: string[], onProgress?: ProgressCallback): Promise<TokenSet> {
    const fileCount = files.length;

    // Handle empty input
    if (fileCount === 0) {
      return {
        tokens: [],
        metadata: {
          extractedAt: new Date().toISOString(),
          fileCount: 0,
          mode: 'thorough',
        },
      };
    }

    // Pass 1: Per-file extraction
    onProgress?.('Pass 1: Per-file extraction');
    const pass1Result = await this.executePass1(files);

    // Handle empty pass 1 results
    if (!pass1Result.files || pass1Result.files.length === 0) {
      return {
        tokens: [],
        metadata: {
          extractedAt: new Date().toISOString(),
          fileCount,
          mode: 'thorough',
        },
      };
    }

    // Delay between passes to avoid rate limits
    await this.sleep(this.DELAY_BETWEEN_PASSES);

    // Pass 2: Pattern detection
    onProgress?.('Pass 2: Pattern detection');
    const pass2Result = await this.executePass2(pass1Result);

    // Delay between passes
    await this.sleep(this.DELAY_BETWEEN_PASSES);

    // Pass 3: Semantic grouping
    onProgress?.('Pass 3: Semantic grouping');
    const pass3Result = await this.executePass3(pass1Result, pass2Result);

    // Delay between passes
    await this.sleep(this.DELAY_BETWEEN_PASSES);

    // Pass 4: Alias detection
    onProgress?.('Pass 4: Alias detection');
    const pass4Result = await this.executePass4(pass3Result);

    // Build final TokenSet
    return {
      tokens: pass4Result.tokens,
      metadata: {
        extractedAt: new Date().toISOString(),
        fileCount,
        mode: 'thorough',
      },
    };
  }

  /**
   * Pass 1: Analyze each file individually and extract all potential tokens
   */
  private async executePass1(files: string[]): Promise<Pass1Result> {
    const prompt = this.buildPass1Prompt();

    // Read file contents
    const fileContents = await this.readFiles(files);

    const context = {
      files: fileContents,
      instruction: 'Analyze each file individually and extract all design tokens with their context.',
    };

    const response = await this.aiProvider.analyze(prompt, context);
    const parsed = this.parseJSON<Pass1Result>(response);

    return parsed;
  }

  /**
   * Pass 2: Compare tokens across files and find patterns/duplicates
   */
  private async executePass2(pass1Result: Pass1Result): Promise<Pass2Result> {
    const prompt = this.buildPass2Prompt();

    const context = {
      tokensFromPass1: pass1Result,
      instruction: 'Identify repeated values across files and detect duplicate tokens.',
    };

    const response = await this.aiProvider.analyze(prompt, context);
    const parsed = this.parseJSON<Pass2Result>(response);

    return parsed;
  }

  /**
   * Pass 3: Group tokens semantically into core/semantic/component hierarchy
   */
  private async executePass3(pass1Result: Pass1Result, pass2Result: Pass2Result): Promise<Pass3Result> {
    const prompt = this.buildPass3Prompt();

    const context = {
      tokensFromPass1: pass1Result,
      patternsFromPass2: pass2Result,
      instruction: 'Organize tokens into hierarchical groups following design system principles.',
    };

    const response = await this.aiProvider.analyze(prompt, context);
    const parsed = this.parseJSON<Pass3Result>(response);

    return parsed;
  }

  /**
   * Pass 4: Create aliases between related tokens
   */
  private async executePass4(pass3Result: Pass3Result): Promise<Pass4Result> {
    const prompt = this.buildPass4Prompt();

    const context = {
      groupsFromPass3: pass3Result,
      instruction: 'Create semantic aliases that reference core tokens using Figma Tokens reference syntax.',
    };

    const response = await this.aiProvider.analyze(prompt, context);
    const parsed = this.parseJSON<Pass4Result>(response);

    return parsed;
  }

  /**
   * Read file contents for analysis
   */
  private async readFiles(files: string[]): Promise<Array<{ path: string; content: string }>> {
    const fileContents: Array<{ path: string; content: string }> = [];

    for (const file of files) {
      try {
        const content = await fs.promises.readFile(file, 'utf-8');
        fileContents.push({ path: file, content });
      } catch (error) {
        // Skip files that can't be read
        console.warn(`Warning: Could not read file ${file}`);
      }
    }

    return fileContents;
  }

  /**
   * Parse JSON response from AI, handling code fences
   */
  private parseJSON<T>(response: string): T {
    try {
      // Remove markdown code fences if present
      let cleanResponse = response.trim();
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```\n?/, '').replace(/\n?```$/, '');
      }

      return JSON.parse(cleanResponse);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Failed to parse AI response as JSON: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Build prompt for Pass 1: Per-file extraction
   */
  private buildPass1Prompt(): string {
    return `You are a design token extraction expert. Your task is to analyze code files individually and extract all potential design tokens.

PASS 1: PER-FILE EXTRACTION

For each file provided:
1. Identify all design token candidates (colors, spacing, typography, effects, etc.)
2. Extract the token name, value, type, and line number
3. Provide context about where/how the token is defined
4. Include ANY value that might be a design token, even if uncertain

Token types to look for:
- color: hex codes (#fff), rgb/rgba, hsl/hsla, named colors
- spacing: padding, margin, gap values (px, rem, em)
- sizing: width, height, size values
- borderRadius: border radius values
- typography: font families, sizes, weights, line heights, letter spacing
- effect: box shadows, opacity
- breakpoint: media query breakpoints
- zIndex: z-index values

Return valid JSON with this structure:
{
  "files": [
    {
      "file": "file path",
      "tokens": [
        {
          "name": "token name as found in code",
          "value": "token value",
          "type": "token type",
          "line": lineNumber,
          "context": "description of where/how it's defined"
        }
      ]
    }
  ]
}

Important:
- Only return valid JSON, no markdown or code fences
- Be thorough - capture every potential token
- Preserve original naming from the code
- Include line numbers for traceability`;
  }

  /**
   * Build prompt for Pass 2: Pattern detection
   */
  private buildPass2Prompt(): string {
    return `You are a design token pattern detection expert. Your task is to analyze tokens from multiple files and identify patterns and duplicates.

PASS 2: PATTERN DETECTION

Analyze the tokens extracted in Pass 1 and:
1. Find values that appear in multiple files
2. Identify exact duplicates (same value, different names)
3. Detect pattern families (e.g., color scales like blue-100, blue-200, blue-300)
4. Suggest consolidated names for duplicates

Return valid JSON with this structure:
{
  "patterns": [
    {
      "value": "token value",
      "occurrences": count,
      "files": ["file1", "file2"],
      "suggestedName": "semantic name for this pattern"
    }
  ],
  "duplicates": [
    {
      "value": "shared value",
      "names": ["name1 in file1", "name2 in file2"],
      "consolidatedName": "suggested unified name"
    }
  ]
}

Important:
- Only return valid JSON, no markdown or code fences
- Focus on finding truly repeated values (not just similar)
- Suggest semantic names that follow design system conventions`;
  }

  /**
   * Build prompt for Pass 3: Semantic grouping
   */
  private buildPass3Prompt(): string {
    return `You are a design system organization expert. Your task is to organize tokens into a semantic hierarchy.

PASS 3: SEMANTIC GROUPING

Organize tokens into three tiers:
1. **Core tokens**: Foundation values (colors.blue.500, spacing.4, typography.base.fontSize)
2. **Semantic tokens**: Purpose-based aliases (colors.primary, spacing.default, typography.body.size)
3. **Component tokens**: Component-specific values (button.background, card.padding)

Use dot notation for hierarchy:
- colors.blue.500 (core color)
- colors.primary (semantic color)
- button.background.default (component token)

Return valid JSON with this structure:
{
  "groups": {
    "core": {
      "colors": [tokens],
      "spacing": [tokens],
      "typography": [tokens]
    },
    "semantic": {
      "colors": [tokens],
      "spacing": [tokens]
    },
    "component": {
      "button": [tokens],
      "card": [tokens]
    }
  }
}

Each token should have: name, value, type, file, line, context (optional)

Important:
- Only return valid JSON, no markdown or code fences
- Use consistent naming conventions (lowercase, dots for hierarchy)
- Group related tokens together
- Preserve file/line metadata from Pass 1`;
  }

  /**
   * Build prompt for Pass 4: Alias detection
   */
  private buildPass4Prompt(): string {
    return `You are a design token aliasing expert. Your task is to create semantic aliases that reference core tokens.

PASS 4: ALIAS DETECTION

Create aliases following these principles:
1. Semantic tokens should reference core tokens using Figma Tokens syntax: {tokenName}
2. Component tokens can reference semantic or core tokens
3. Create meaningful relationships (e.g., colors.primary → colors.blue.500)
4. Avoid circular references

Examples:
- Core: "colors.blue.500": "#0ea5e9"
- Semantic alias: "colors.primary": "{colors.blue.500}"
- Component alias: "button.background": "{colors.primary}"

Return valid JSON with this structure:
{
  "tokens": [
    {
      "name": "token name",
      "value": "actual value or {reference}",
      "type": "token type",
      "file": "source file",
      "line": lineNumber,
      "context": "alias" or other context
    }
  ],
  "aliases": [
    {
      "alias": "alias name",
      "references": "target token name",
      "reasoning": "why this alias makes sense"
    }
  ]
}

Important:
- Only return valid JSON, no markdown or code fences
- Use {tokenName} syntax for references
- Include both base tokens and aliases in the tokens array
- Preserve metadata (file, line) from earlier passes
- Create a clean, logical token hierarchy`;
  }

  /**
   * Sleep for specified milliseconds (for rate limiting)
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
