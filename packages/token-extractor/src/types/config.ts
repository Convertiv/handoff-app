export type AnalysisMode = 'quick' | 'balanced' | 'thorough';
export type AIProvider = 'anthropic' | 'openai';

export interface ExtractorConfig {
  // AI Configuration
  apiKey?: string;
  provider: AIProvider;
  model?: string;

  // Analysis Configuration
  mode?: AnalysisMode;
  interactive?: boolean;

  // File Configuration
  include?: string[];
  exclude?: string[];

  // Output Configuration
  outputPath?: string;
  generateReport?: boolean;
  generateAudit?: boolean;
}

export interface DiscoveryResult {
  fileCount: number;
  lineCount: number;
  frameworks: string[];
  hasExistingTokens: boolean;
  directories: {
    styles: string[];
    components: string[];
  };
}

export interface ModeRecommendation {
  mode: AnalysisMode;
  reasoning: string;
  estimatedCost: number;
  estimatedTime: number;
  expectedAccuracy: number;
}
