# Token Extraction Report

## Summary
✓ Extracted 127 tokens across 8 categories
✓ Found 8 duplicate values (can be consolidated)

**Extracted at:** 11/11/2025, 2:30:00 PM
**Mode:** balanced
**Framework:** react, styled-components
**Files analyzed:** 45
**Lines of code:** 3,200

## Breakdown
- **Colors:** 45 tokens
- **Spacing:** 12 tokens
- **Font Size:** 10 tokens
- **Line Height:** 8 tokens
- **Font Weight:** 5 tokens
- **Border Radius:** 6 tokens
- **Box Shadow:** 4 tokens
- **Opacity:** 3 tokens

## Recommendations
- **Consolidate duplicate values:** Found 8 unique values used by multiple tokens. Consider using token aliases to reduce duplication.
- **Organize color palettes:** Group color tokens into semantic palettes (e.g., primary, secondary, neutral) for better maintainability.
- **Verify spacing scale:** Ensure your spacing tokens follow a consistent scale (e.g., 4px, 8px, 16px, 24px, 32px).
- **Create typography compositions:** Consider grouping font size, line height, and letter spacing into typography scale tokens.

## Next Steps

### Import into Figma Tokens Plugin

1. **Install the plugin:**
   - Open Figma
   - Go to Plugins → Browse plugins in Community
   - Search for "Figma Tokens" and install

2. **Import your tokens:**
   - Open the Figma Tokens plugin
   - Click on the settings icon
   - Select "Import" → "Load from JSON"
   - Upload the generated `figma-tokens.json` file

3. **Apply to your designs:**
   - Select any element in Figma
   - Use the plugin to apply tokens
   - Tokens will update automatically when changed

### Review and Refine

- **Check token names:** Ensure names follow your naming convention
- **Organize hierarchically:** Group related tokens (e.g., `color.primary.500`)
- **Create aliases:** Use token references for related values
- **Test thoroughly:** Apply tokens to various components to verify correctness

### Maintain Your Tokens

- **Version control:** Store `figma-tokens.json` in your repository
- **Sync regularly:** Re-run extraction when design tokens change in code
- **Document usage:** Add comments to describe token purposes and use cases
