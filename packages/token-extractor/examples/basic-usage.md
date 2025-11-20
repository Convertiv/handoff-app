# Basic Usage Example

This example demonstrates the simplest way to use Token Extractor on a typical React project.

## Project Structure

```
my-app/
├── src/
│   ├── components/
│   │   ├── Button.js
│   │   └── Card.js
│   ├── styles/
│   │   ├── colors.css
│   │   └── spacing.css
│   └── theme.js
├── package.json
└── ...
```

## Source Files

### src/styles/colors.css

```css
:root {
  --color-primary: #0ea5e9;
  --color-secondary: #8b5cf6;
  --color-success: #10b981;
  --color-error: #ef4444;
  --color-warning: #f59e0b;

  --color-gray-50: #f9fafb;
  --color-gray-100: #f3f4f6;
  --color-gray-200: #e5e7eb;
  --color-gray-900: #111827;
}
```

### src/styles/spacing.css

```css
:root {
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-2xl: 48px;
}
```

### src/theme.js

```javascript
export const theme = {
  typography: {
    fontFamily: {
      sans: 'Inter, system-ui, sans-serif',
      mono: 'Menlo, Monaco, monospace',
    },
    fontSize: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    full: '9999px',
  },
};
```

## Running Token Extractor

### Step 1: Navigate to Project

```bash
cd my-app
```

### Step 2: Run Extraction

```bash
npx @handoff/token-extractor extract
```

### Step 3: Interactive Prompts

The tool will prompt you with:

```
🔍 Scanning project...

Found 15 files (850 lines)
Frameworks: react
Existing tokens: No

📊 Discovery Results:
  • Style files: 2
  • Component files: 2
  • Theme files: 1
  • Lines of code: 850

💡 Recommended Mode: QUICK
  • Cost: ~$0.15
  • Time: ~60 seconds
  • Accuracy: 75%

? Which AI provider would you like to use?
  > Anthropic (Claude) - Recommended for code analysis
    OpenAI (GPT-4)
```

After entering your API key:

```
🎯 Select Analysis Mode:

? Choose how to analyze your codebase:
  > QUICK [RECOMMENDED]
    BALANCED
    THOROUGH

? Proceed with QUICK mode? (Est. cost: $0.15): (Y/n)
```

### Step 4: Extraction Process

```
✨ Extracting tokens...

  ✓ Parsing CSS files (2 files)
  ✓ Parsing JS files (1 file)
  ✓ Refining with AI
  ✓ Generating output files

📄 Files written:
   • ./figma-tokens.json
   • ./token-extraction-report.md
   • ./token-audit.json

✅ Extraction complete!
```

## Generated Output

### figma-tokens.json

```json
{
  "colors": {
    "primary": {
      "value": "#0ea5e9",
      "type": "color"
    },
    "secondary": {
      "value": "#8b5cf6",
      "type": "color"
    },
    "success": {
      "value": "#10b981",
      "type": "color"
    },
    "error": {
      "value": "#ef4444",
      "type": "color"
    },
    "warning": {
      "value": "#f59e0b",
      "type": "color"
    },
    "gray": {
      "50": {
        "value": "#f9fafb",
        "type": "color"
      },
      "100": {
        "value": "#f3f4f6",
        "type": "color"
      },
      "200": {
        "value": "#e5e7eb",
        "type": "color"
      },
      "900": {
        "value": "#111827",
        "type": "color"
      }
    }
  },
  "spacing": {
    "xs": {
      "value": "4px",
      "type": "spacing"
    },
    "sm": {
      "value": "8px",
      "type": "spacing"
    },
    "md": {
      "value": "16px",
      "type": "spacing"
    },
    "lg": {
      "value": "24px",
      "type": "spacing"
    },
    "xl": {
      "value": "32px",
      "type": "spacing"
    },
    "2xl": {
      "value": "48px",
      "type": "spacing"
    }
  },
  "fontFamily": {
    "sans": {
      "value": "Inter, system-ui, sans-serif",
      "type": "fontFamily"
    },
    "mono": {
      "value": "Menlo, Monaco, monospace",
      "type": "fontFamily"
    }
  },
  "fontSize": {
    "xs": {
      "value": "12px",
      "type": "fontSize"
    },
    "sm": {
      "value": "14px",
      "type": "fontSize"
    },
    "base": {
      "value": "16px",
      "type": "fontSize"
    },
    "lg": {
      "value": "18px",
      "type": "fontSize"
    },
    "xl": {
      "value": "20px",
      "type": "fontSize"
    },
    "2xl": {
      "value": "24px",
      "type": "fontSize"
    }
  },
  "fontWeight": {
    "normal": {
      "value": "400",
      "type": "fontWeight"
    },
    "medium": {
      "value": "500",
      "type": "fontWeight"
    },
    "semibold": {
      "value": "600",
      "type": "fontWeight"
    },
    "bold": {
      "value": "700",
      "type": "fontWeight"
    }
  },
  "borderRadius": {
    "sm": {
      "value": "4px",
      "type": "borderRadius"
    },
    "md": {
      "value": "8px",
      "type": "borderRadius"
    },
    "lg": {
      "value": "12px",
      "type": "borderRadius"
    },
    "full": {
      "value": "9999px",
      "type": "borderRadius"
    }
  }
}
```

## Next Steps

### 1. Review the Report

Open `token-extraction-report.md` to see:
- Token statistics and breakdown
- Recommendations for improvements
- Figma integration instructions

### 2. Import to Figma

1. Open Figma and install the Figma Tokens plugin
2. Open the plugin in your design file
3. Go to Settings → Import → Load from JSON
4. Upload `figma-tokens.json`

### 3. Apply Tokens

In Figma:
1. Select any element
2. Open Figma Tokens plugin
3. Click a token to apply it (e.g., `colors.primary` to fill color)

### 4. Iterate

As you add more tokens to your code:
```bash
npx @handoff/token-extractor extract
```

This will update your `figma-tokens.json` with the latest tokens.

## Tips

- **Save your API key** when prompted to avoid re-entering it
- **Review the audit file** (`token-audit.json`) for cleanup suggestions
- **Commit tokens to git** to track changes over time
- **Use npm scripts** for convenience:

```json
{
  "scripts": {
    "tokens": "token-extractor extract"
  }
}
```

Then run: `npm run tokens`
