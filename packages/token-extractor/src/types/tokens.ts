export type TokenType =
  | 'color'
  | 'spacing'
  | 'sizing'
  | 'borderRadius'
  | 'typography'
  | 'fontFamily'
  | 'fontSize'
  | 'lineHeight'
  | 'fontWeight'
  | 'letterSpacing'
  | 'effect'
  | 'boxShadow'
  | 'opacity'
  | 'breakpoint'
  | 'zIndex';

export type TokenValue = string | number;

export interface ExtractedToken {
  name: string;
  value: TokenValue;
  type: TokenType;
  file: string;
  line?: number;
  context?: string;
}

export interface TokenSet {
  tokens: ExtractedToken[];
  metadata: {
    extractedAt: string;
    framework?: string;
    fileCount: number;
    lineCount?: number;
    mode?: 'quick' | 'balanced' | 'thorough';
  };
}

export interface TokenGroup {
  category: string;
  tokens: ExtractedToken[];
}
