# Styled Components Example

This example shows how Token Extractor works with styled-components and CSS-in-JS patterns.

## Project Structure

```
my-styled-app/
├── src/
│   ├── theme/
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   └── index.ts
│   ├── components/
│   │   ├── Button.tsx
│   │   └── Card.tsx
│   └── App.tsx
├── package.json
└── ...
```

## Source Files

### src/theme/colors.ts

```typescript
export const colors = {
  // Brand colors
  brand: {
    primary: '#0ea5e9',
    secondary: '#8b5cf6',
    accent: '#f59e0b',
  },

  // Semantic colors
  semantic: {
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
  },

  // Neutral palette
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },

  // Background & surface
  background: {
    default: '#ffffff',
    paper: '#fafafa',
    elevated: '#ffffff',
  },

  // Text colors
  text: {
    primary: '#171717',
    secondary: '#525252',
    disabled: '#a3a3a3',
    inverse: '#ffffff',
  },
};
```

### src/theme/typography.ts

```typescript
export const typography = {
  // Font families
  fontFamily: {
    sans: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    mono: '"Fira Code", "Courier New", monospace',
    display: '"Playfair Display", serif',
  },

  // Font sizes
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem',// 30px
    '4xl': '2.25rem', // 36px
  },

  // Font weights
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },

  // Line heights
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2,
  },

  // Letter spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
};
```

### src/theme/index.ts

```typescript
import { colors } from './colors';
import { typography } from './typography';

export const theme = {
  colors,
  typography,

  // Spacing scale
  spacing: {
    0: '0',
    1: '0.25rem',  // 4px
    2: '0.5rem',   // 8px
    3: '0.75rem',  // 12px
    4: '1rem',     // 16px
    5: '1.25rem',  // 20px
    6: '1.5rem',   // 24px
    8: '2rem',     // 32px
    10: '2.5rem',  // 40px
    12: '3rem',    // 48px
    16: '4rem',    // 64px
  },

  // Border radius
  borderRadius: {
    none: '0',
    sm: '0.125rem',    // 2px
    base: '0.25rem',   // 4px
    md: '0.375rem',    // 6px
    lg: '0.5rem',      // 8px
    xl: '0.75rem',     // 12px
    '2xl': '1rem',     // 16px
    full: '9999px',
  },

  // Shadows
  boxShadow: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },

  // Z-index scale
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
  },
};

export type Theme = typeof theme;
```

### src/components/Button.tsx

```typescript
import styled from 'styled-components';

export const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: ${props => props.theme.spacing[3]} ${props => props.theme.spacing[6]};
  font-family: ${props => props.theme.typography.fontFamily.sans};
  font-size: ${props => props.theme.typography.fontSize.base};
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  border-radius: ${props => props.theme.borderRadius.md};
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;

  background-color: ${props =>
    props.variant === 'secondary'
      ? props.theme.colors.brand.secondary
      : props.theme.colors.brand.primary};

  color: ${props => props.theme.colors.text.inverse};
  box-shadow: ${props => props.theme.boxShadow.sm};

  &:hover {
    box-shadow: ${props => props.theme.boxShadow.md};
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;
```

## Running Token Extractor

### Command

```bash
cd my-styled-app
token-extractor extract --mode balanced
```

### Why Balanced Mode?

Balanced mode is ideal for styled-components because:
- Handles complex JavaScript object structures
- Recognizes theme provider patterns
- Works well with TypeScript
- Captures both static values and theme references

## Expected Output

### Token Count

```
✨ Extraction Summary:
  • Total tokens: 87
  • Colors: 28
  • Typography: 31
  • Spacing: 11
  • Border Radius: 8
  • Box Shadow: 5
  • Z-Index: 7
```

### Partial figma-tokens.json

```json
{
  "colors": {
    "brand": {
      "primary": {
        "value": "#0ea5e9",
        "type": "color",
        "description": "Primary brand color"
      },
      "secondary": {
        "value": "#8b5cf6",
        "type": "color",
        "description": "Secondary brand color"
      }
    },
    "semantic": {
      "success": {
        "value": "#10b981",
        "type": "color"
      },
      "error": {
        "value": "#ef4444",
        "type": "color"
      }
    },
    "text": {
      "primary": {
        "value": "#171717",
        "type": "color",
        "description": "Primary text color"
      },
      "inverse": {
        "value": "#ffffff",
        "type": "color",
        "description": "Text on dark backgrounds"
      }
    }
  },
  "spacing": {
    "0": { "value": "0", "type": "spacing" },
    "1": { "value": "0.25rem", "type": "spacing" },
    "2": { "value": "0.5rem", "type": "spacing" },
    "4": { "value": "1rem", "type": "spacing" },
    "6": { "value": "1.5rem", "type": "spacing" },
    "8": { "value": "2rem", "type": "spacing" }
  },
  "fontFamily": {
    "sans": {
      "value": "\"Inter\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif",
      "type": "fontFamily"
    },
    "mono": {
      "value": "\"Fira Code\", \"Courier New\", monospace",
      "type": "fontFamily"
    }
  },
  "fontSize": {
    "xs": { "value": "0.75rem", "type": "fontSize" },
    "sm": { "value": "0.875rem", "type": "fontSize" },
    "base": { "value": "1rem", "type": "fontSize" },
    "lg": { "value": "1.125rem", "type": "fontSize" }
  },
  "boxShadow": {
    "sm": {
      "value": "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
      "type": "boxShadow"
    },
    "md": {
      "value": "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
      "type": "boxShadow"
    }
  }
}
```

## Using with ThemeProvider

### src/App.tsx

```typescript
import { ThemeProvider } from 'styled-components';
import { theme } from './theme';
import { Button } from './components/Button';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <div>
        <Button variant="primary">Primary Button</Button>
        <Button variant="secondary">Secondary Button</Button>
      </div>
    </ThemeProvider>
  );
}

export default App;
```

## Advanced: Creating Aliases

If you want semantic tokens to reference core tokens, use Thorough mode:

```bash
token-extractor extract --mode thorough
```

This produces aliases like:

```json
{
  "colors": {
    "brand": {
      "primary": {
        "value": "#0ea5e9",
        "type": "color"
      }
    },
    "button": {
      "background": {
        "primary": {
          "value": "{colors.brand.primary}",
          "type": "color",
          "description": "References brand primary color"
        }
      }
    }
  }
}
```

## Tips for Styled Components Projects

1. **Organize your theme**: Keep tokens in separate files by category
2. **Use TypeScript**: Better inference and extraction accuracy
3. **Export as objects**: Easier for AI to parse than inline definitions
4. **Document your tokens**: Add JSDoc comments for better context extraction
5. **Use Balanced or Thorough mode**: Skip Quick mode for complex JS patterns

## Common Issues

### Issue: Theme values not extracted

**Solution**: Ensure your theme is exported as a plain object, not a function.

**Good:**
```typescript
export const theme = {
  colors: { primary: '#0ea5e9' }
};
```

**Bad:**
```typescript
export const createTheme = () => ({
  colors: { primary: '#0ea5e9' }
});
```

### Issue: Props-based values extracted as tokens

If you see entries like `${props => props.theme...}` in output, manually remove them. The tool tries to skip these but may occasionally include them.

### Issue: Missing nested tokens

Use Thorough mode for deeply nested theme objects. Quick mode may not traverse all levels.

## Next Steps

1. Import tokens to Figma using Figma Tokens plugin
2. Apply tokens to your designs
3. Set up sync between code and Figma (see Figma Tokens GitHub sync)
4. Re-run extraction when theme changes

```bash
npm run tokens
```
