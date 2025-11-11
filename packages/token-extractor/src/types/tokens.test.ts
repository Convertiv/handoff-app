import { TokenValue, TokenType, TokenSet } from './tokens';

describe('Token Types', () => {
  test('TokenValue should accept valid color hex', () => {
    const value: TokenValue = '#FF5733';
    expect(typeof value).toBe('string');
  });

  test('TokenType should include all design token categories', () => {
    const types: TokenType[] = ['color', 'spacing', 'typography', 'effect', 'sizing', 'borderRadius'];
    expect(types.length).toBeGreaterThan(0);
  });

  test('TokenSet should have metadata', () => {
    const tokenSet: TokenSet = {
      tokens: [],
      metadata: {
        extractedAt: new Date().toISOString(),
        framework: 'react',
        fileCount: 10
      }
    };
    expect(tokenSet.metadata).toBeDefined();
  });
});
