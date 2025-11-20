import { ExtractorConfig, AnalysisMode } from './config';

describe('Config Types', () => {
  test('AnalysisMode should have three options', () => {
    const modes: AnalysisMode[] = ['quick', 'balanced', 'thorough'];
    expect(modes.length).toBe(3);
  });

  test('ExtractorConfig should have apiKey', () => {
    const config: Partial<ExtractorConfig> = {
      apiKey: 'test-key',
      provider: 'anthropic'
    };
    expect(config.apiKey).toBeDefined();
  });
});
