import { FigmaToken, FigmaTokensJSON, validateFigmaTokensJSON } from './figma-tokens';

describe('Figma Tokens Types', () => {
  test('FigmaToken should have value and type', () => {
    const token: FigmaToken = {
      value: '#FF5733',
      type: 'color'
    };
    expect(token.value).toBeDefined();
    expect(token.type).toBeDefined();
  });

  test('validateFigmaTokensJSON should accept valid structure', () => {
    const json: FigmaTokensJSON = {
      colors: {
        primary: {
          value: '#0ea5e9',
          type: 'color'
        }
      }
    };
    expect(() => validateFigmaTokensJSON(json)).not.toThrow();
  });
});
