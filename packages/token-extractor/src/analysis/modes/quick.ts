import type { AIProvider } from '../ai-client';
import type { ExtractedToken, TokenSet } from '../../types/tokens';

/**
 * Generic parser interface for extracting tokens from files
 */
export interface Parser {
  parse?(filePath: string): Promise<ExtractedToken[]>;
  parseFile?(filePath: string): Promise<ExtractedToken[]>;
}

/**
 * Quick Mode: Fast token extraction using AST parsers + AI refinement
 *
 * Strategy:
 * 1. Use PostCSS parser to extract tokens from CSS/SCSS files
 * 2. Use Babel parser to extract tokens from JS/TS theme files
 * 3. Combine raw tokens from both parsers
 * 4. Send to AI for grouping, semantic naming, and duplicate detection
 * 5. Parse AI response into structured TokenSet following Figma Tokens conventions
 */
export class QuickMode {
  private aiProvider: AIProvider;
  private postCSSParser: Parser;
  private babelParser: Parser;

  constructor(aiProvider: AIProvider, postCSSParser: Parser, babelParser: Parser) {
    this.aiProvider = aiProvider;
    this.postCSSParser = postCSSParser;
    this.babelParser = babelParser;
  }

  /**
   * Extract tokens from files and refine using AI
   *
   * @param cssFiles - Array of CSS/SCSS file paths
   * @param jsFiles - Array of JS/TS file paths
   * @returns TokenSet with refined tokens and metadata
   */
  async extract(cssFiles: string[], jsFiles: string[]): Promise<TokenSet> {
    const totalFiles = cssFiles.length + jsFiles.length;

    // Handle empty input
    if (totalFiles === 0) {
      return {
        tokens: [],
        metadata: {
          extractedAt: new Date().toISOString(),
          fileCount: 0,
          mode: 'quick',
        },
      };
    }

    // Step 1: Parse CSS/SCSS files
    const cssTokens = await this.parseFiles(cssFiles, this.postCSSParser);

    // Step 2: Parse JS/TS files
    const jsTokens = await this.parseFiles(jsFiles, this.babelParser);

    // Step 3: Combine all tokens
    const rawTokens = [...cssTokens, ...jsTokens];

    // Handle no tokens found
    if (rawTokens.length === 0) {
      return {
        tokens: [],
        metadata: {
          extractedAt: new Date().toISOString(),
          fileCount: totalFiles,
          mode: 'quick',
        },
      };
    }

    // Step 4: Send to AI for refinement
    const refinedTokens = await this.refineWithAI(rawTokens);

    // Step 5: Build TokenSet with metadata
    return {
      tokens: refinedTokens,
      metadata: {
        extractedAt: new Date().toISOString(),
        fileCount: totalFiles,
        mode: 'quick',
      },
    };
  }

  /**
   * Parse multiple files using a parser
   */
  private async parseFiles(files: string[], parser: Parser): Promise<ExtractedToken[]> {
    const allTokens: ExtractedToken[] = [];

    for (const file of files) {
      // Support both parse() and parseFile() methods
      const parseMethod = parser.parse || parser.parseFile;
      if (!parseMethod) {
        throw new Error('Parser must implement parse() or parseFile() method');
      }
      const tokens = await parseMethod.call(parser, file);
      allTokens.push(...tokens);
    }

    return allTokens;
  }

  /**
   * Send raw tokens to AI for grouping, semantic naming, and duplicate detection
   */
  private async refineWithAI(rawTokens: ExtractedToken[]): Promise<ExtractedToken[]> {
    const prompt = this.buildRefinementPrompt();
    const context = {
      tokens: rawTokens,
    };

    const aiResponse = await this.aiProvider.analyze(prompt, context);

    // Parse AI response
    const parsedResponse = this.parseAIResponse(aiResponse);

    return parsedResponse.tokens;
  }

  /**
   * Build the prompt for AI refinement
   */
  private buildRefinementPrompt(): string {
    return `You are a design token expert. Your task is to analyze raw design tokens extracted from code and organize them into a clean, semantic structure following Figma Tokens plugin conventions.

Instructions:
1. Group these tokens by category (colors, spacing, typography, sizing, borderRadius, etc.)
2. Generate semantic names following Figma Tokens conventions (e.g., "colors.primary.500", "spacing.md", "typography.heading.fontSize")
3. Identify duplicates (tokens with the same value but different names) and suggest consolidation
4. Maintain the original file and line information for each token
5. Ensure all token names follow a consistent hierarchical structure with dot notation

Token Categories:
- colors: hex codes, rgb values, color names
- spacing: padding, margin, gap values
- sizing: width, height, size values
- borderRadius: corner radius values
- typography: font families, sizes, weights, line heights, letter spacing
- effect: box shadows, opacity
- breakpoint: media query breakpoints
- zIndex: z-index values

Return your response as valid JSON with this structure:
{
  "tokens": [
    {
      "name": "semantic.name.here",
      "value": "token value",
      "type": "tokenType",
      "file": "original file path",
      "line": originalLineNumber,
      "context": "optional context about grouping/renaming"
    }
  ],
  "duplicates": [
    {
      "originalNames": ["name1", "name2"],
      "consolidatedName": "semantic.name",
      "value": "shared value"
    }
  ]
}

Important:
- Only return valid JSON, no markdown or code fences
- Preserve file and line information from the original tokens
- Be consistent with naming conventions
- Group similar tokens together with a common prefix`;
  }

  /**
   * Parse AI response into tokens
   */
  private parseAIResponse(response: string): { tokens: ExtractedToken[] } {
    try {
      // Remove markdown code fences if present
      let cleanResponse = response.trim();
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```\n?/, '').replace(/\n?```$/, '');
      }

      const parsed = JSON.parse(cleanResponse);

      if (!parsed.tokens || !Array.isArray(parsed.tokens)) {
        throw new Error('AI response missing tokens array');
      }

      return {
        tokens: parsed.tokens.map((token: any) => ({
          name: token.name,
          value: token.value,
          type: token.type,
          file: token.file,
          line: token.line,
          context: token.context,
        })),
      };
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Failed to parse AI response as JSON: ${error.message}`);
      }
      throw error;
    }
  }
}
