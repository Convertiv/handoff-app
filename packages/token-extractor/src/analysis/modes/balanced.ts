import * as fs from 'fs';
import type { AIProvider } from '../ai-client';
import type { ExtractedToken, TokenSet } from '../../types/tokens';

/**
 * Interface for file content with path
 */
interface FileContent {
  path: string;
  content: string;
}

/**
 * Balanced Mode: Single-pass AI extraction with file batching
 *
 * Strategy:
 * 1. Load file contents from disk
 * 2. Batch files into reasonable sizes (~50 files at a time) for AI context window
 * 3. Send comprehensive prompt: "Analyze these files and extract ALL design tokens. Group by type. Follow Figma Tokens naming."
 * 4. Handle CSS, SCSS, JS, TS, styled-components patterns
 * 5. Parse AI JSON response into TokenSet
 * 6. Merge results from all batches
 * 7. Include metadata (mode, file count, timestamp)
 */
export class BalancedMode {
  private aiProvider: AIProvider;
  private readonly BATCH_SIZE = 50;

  constructor(aiProvider: AIProvider) {
    this.aiProvider = aiProvider;
  }

  /**
   * Extract tokens from files using single-pass AI analysis with batching
   *
   * @param files - Array of file paths to analyze
   * @returns TokenSet with extracted tokens and metadata
   */
  async extract(files: string[]): Promise<TokenSet> {
    const totalFiles = files.length;

    // Handle empty input
    if (totalFiles === 0) {
      return {
        tokens: [],
        metadata: {
          extractedAt: new Date().toISOString(),
          fileCount: 0,
          mode: 'balanced',
        },
      };
    }

    // Step 1: Load file contents from disk
    const fileContents = await this.loadFiles(files);

    // Step 2: Batch files into reasonable sizes
    const batches = this.batchFiles(fileContents, this.BATCH_SIZE);

    // Step 3: Process each batch through AI
    const allTokens: ExtractedToken[] = [];
    for (const batch of batches) {
      const batchTokens = await this.processBatch(batch);
      allTokens.push(...batchTokens);
    }

    // Step 4: Build TokenSet with metadata
    return {
      tokens: allTokens,
      metadata: {
        extractedAt: new Date().toISOString(),
        fileCount: totalFiles,
        mode: 'balanced',
      },
    };
  }

  /**
   * Load file contents from disk
   */
  private async loadFiles(files: string[]): Promise<FileContent[]> {
    const fileContents: FileContent[] = [];

    for (const file of files) {
      const content = await fs.promises.readFile(file, 'utf-8');
      fileContents.push({
        path: file,
        content,
      });
    }

    return fileContents;
  }

  /**
   * Batch files into chunks of specified size
   */
  private batchFiles(files: FileContent[], batchSize: number): FileContent[][] {
    const batches: FileContent[][] = [];

    for (let i = 0; i < files.length; i += batchSize) {
      batches.push(files.slice(i, i + batchSize));
    }

    return batches;
  }

  /**
   * Process a batch of files through AI
   */
  private async processBatch(batch: FileContent[]): Promise<ExtractedToken[]> {
    const prompt = this.buildExtractionPrompt();
    const context = {
      files: batch,
    };

    const aiResponse = await this.aiProvider.analyze(prompt, context);

    // Parse AI response
    const parsedResponse = this.parseAIResponse(aiResponse);

    return parsedResponse.tokens;
  }

  /**
   * Build comprehensive extraction prompt for AI
   */
  private buildExtractionPrompt(): string {
    return `You are a design token extraction expert. Your task is to analyze these files and extract ALL design tokens from them.

Instructions:
1. Analyze each file and extract all design tokens (colors, spacing, typography, sizing, borders, effects, etc.)
2. Support diverse patterns:
   - CSS custom properties (--variable-name)
   - SCSS/SASS variables ($variable-name)
   - JavaScript/TypeScript theme objects
   - styled-components theme definitions
   - CSS-in-JS inline styles
3. Group tokens by type (colors, spacing, typography, sizing, borderRadius, effect, etc.)
4. Generate semantic names following Figma Tokens naming conventions:
   - Use dot notation for hierarchy (e.g., "colors.primary.500", "spacing.md")
   - Group related tokens with common prefixes
   - Use descriptive, consistent names
5. Maintain the original file path and line number for each token
6. Extract the actual values (hex codes, pixel values, etc.)

Token Categories to Extract:
- colors: hex codes (#RRGGBB), rgb/rgba values, named colors
- spacing: padding, margin, gap values (px, rem, em, etc.)
- sizing: width, height, size values
- borderRadius: corner radius values
- typography: font families, sizes, weights, line heights, letter spacing
- fontFamily: font family definitions
- fontSize: font size values
- lineHeight: line height values
- fontWeight: font weight values
- letterSpacing: letter spacing values
- effect: box shadows, text shadows
- boxShadow: box shadow definitions
- opacity: opacity values
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
      "line": lineNumber
    }
  ]
}

Important:
- Only return valid JSON, no markdown or code fences
- Extract tokens from ALL provided files
- Preserve file paths and line numbers accurately
- Be consistent with naming conventions across all files
- Group similar tokens together with common prefixes
- Handle all pattern types: CSS, SCSS, JS theme objects, styled-components, CSS-in-JS`;
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
