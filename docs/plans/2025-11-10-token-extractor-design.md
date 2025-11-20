# Token Extractor CLI - Code-to-Figma Design System Tool

**Date:** 2025-11-10
**Status:** Approved Design
**Goal:** Build a standalone CLI tool that extracts design tokens from any codebase and generates Figma Tokens plugin JSON

---

## Executive Summary

The Token Extractor CLI is a reverse-engineering tool for the Handoff ecosystem. While Handoff converts Figma designs to code, this tool does the opposite: it analyzes existing codebases to extract design tokens (colors, spacing, typography, effects) and outputs them in a format ready for import into Figma via the Figma Tokens plugin.

**Key Innovation:** Adaptive AI-powered analysis with three modes (Quick/Balanced/Thorough) that users choose based on their needs and budget, plus a design system health audit as a bonus output.

---

## Problem Statement

Design teams often inherit codebases with inconsistent styling and no design system. They need to:
1. Extract existing design patterns from code
2. Import them into Figma to create a design system
3. Understand what cleanup work is needed

Current solutions require manual extraction or rigid parsers that miss non-standard patterns.

---

## Solution Overview

A standalone CLI (`@handoff/token-extractor`) that:
- Runs in any local repository
- Uses AI to intelligently extract tokens (supports multiple frameworks/patterns)
- Presents 3 analysis modes with cost/time/accuracy trade-offs
- Asks interactive questions to refine ambiguous tokens
- Generates Figma Tokens plugin JSON
- Provides design system health audit with cleanup tasks

---

## Architecture

### High-Level Flow

```
User runs CLI in target repo
    ↓
Discovery Pass (free, ~5 sec)
  - Scan file structure
  - Detect frameworks
  - Count style files/lines
    ↓
Present 3 analysis modes
  - Quick: AST + light AI ($0.10-0.30, 60s, 75%)
  - Balanced: Single AI pass ($0.50-1.50, 90s, 85%) ⭐
  - Thorough: Multi-pass AI ($1.00-5.00, 5min, 95%)
    ↓
User selects mode + confirms cost
    ↓
Analysis runs with progress indicators
    ↓
Interactive questions (when ambiguous)
    ↓
Generate outputs:
  - figma-tokens.json (primary)
  - figma-tokens-report.md (summary)
  - figma-tokens-cleanup.md (audit)
```

### Three Analysis Modes

#### Mode 1: Quick (Hybrid AST + AI)

**Best for:** Standard CSS/SCSS with existing variables

**Process:**
1. Use PostCSS/Babel to parse CSS/SCSS files
2. Extract all CSS custom properties (`--*`)
3. Extract all SCSS variables (`$*`)
4. Find hex colors, px/rem values with regex
5. Send raw tokens to AI for grouping/naming

**Characteristics:**
- **Cost:** $0.10-0.30
- **Time:** ~60 seconds
- **Accuracy:** 75% (misses computed values, theme objects)
- **Best for:** Repositories with standard CSS structure

#### Mode 2: Balanced (Single-Pass AI) ⭐ RECOMMENDED

**Best for:** Modern frameworks, CSS-in-JS, medium repos

**Process:**
1. Batch related files (components + styles, ~50 at a time)
2. Load into AI context (single conversation)
3. AI analyzes all patterns, extracts tokens, suggests groupings
4. Returns structured token list

**Characteristics:**
- **Cost:** $0.50-1.50
- **Time:** 30-90 seconds
- **Accuracy:** 85% (handles diverse patterns)
- **Best for:** React/Vue with styled-components, Tailwind, CSS Modules

#### Mode 3: Thorough (Multi-Pass Pipeline)

**Best for:** Large codebases, complex design systems

**Process:**
1. **Pass 1:** Per-file extraction (AI analyzes each file individually)
2. **Pass 2:** Pattern detection (identify repeated values across files)
3. **Pass 3:** Semantic grouping (organize by purpose, apply hierarchy)
4. **Pass 4:** Alias detection (create token references)
5. **Interactive validation:** Present full tree, allow adjustments

**Characteristics:**
- **Cost:** $1.00-5.00
- **Time:** 2-5 minutes
- **Accuracy:** 90-95% (finds subtle patterns)
- **Best for:** Enterprise design systems, large monorepos

---

## Discovery Pass Details

### What Gets Detected

1. **Repository Metrics:**
   - Total lines of style code
   - Number of style files
   - Estimated token count (~1 token per 5 lines)
   - Directory depth

2. **Framework Detection:**
   - CSS methodologies: BEM, Tailwind, CSS Modules, CSS-in-JS
   - Pre-processors: SCSS, LESS, PostCSS
   - Component frameworks: React, Vue, Angular, Web Components
   - Design systems: Material-UI, Chakra, Ant Design (via imports)

3. **Existing Token Infrastructure:**
   - CSS custom properties (`--variables`)
   - SCSS variables (`$variables`)
   - Theme files (theme.js, tokens.json)
   - Style Dictionary or similar

### Recommendation Algorithm

```typescript
function recommendMode(discovery: DiscoveryResult): Recommendation {
  const { fileCount, lineCount, hasTokens, frameworks } = discovery;

  // Hybrid mode: Good existing token structure
  if (hasTokens && frameworks.includes('standard-css')) {
    return 'quick';
  }

  // Balanced mode: Medium repos, modern frameworks
  if (lineCount < 10000 && frameworks.includes('modern')) {
    return 'balanced';
  }

  // Thorough mode: Large/complex repos
  return 'thorough';
}
```

### Cost Estimation

- **Quick:** Count existing tokens × $0.001
- **Balanced:** (lineCount / 1000) × $0.50
- **Thorough:** (fileCount × $0.20) + cross-analysis fee

---

## AI Integration

### Provider Abstraction

```typescript
interface AIProvider {
  analyze(prompt: string, files: FileContent[]): Promise<TokenSet>;
  refine(tokens: TokenSet, question: string): Promise<TokenSet>;
  askUser(context: string): Promise<string>;
}

class AnthropicProvider implements AIProvider {
  // Claude Sonnet 3.5 - best for code understanding
}

class OpenAIProvider implements AIProvider {
  // GPT-4o - alternative option
}
```

### API Key Configuration

Three methods:
1. Environment variables: `ANTHROPIC_API_KEY` or `OPENAI_API_KEY`
2. Config file: `.token-extractor.config.json` (gitignored)
3. Interactive prompt: "Enter your API key:" (stored temporarily)

### Core Extraction Prompt Template

```
You are a design system expert analyzing a codebase to extract design tokens.

CONTEXT:
- Framework: {detected_framework}
- Files analyzed: {file_count}
- Existing tokens found: {existing_tokens}

TASK:
Extract ALL design tokens from the provided files. Include:
1. Colors (hex, rgb, hsl, named)
2. Spacing (margin, padding, gap)
3. Typography (font-family, font-size, line-height, font-weight)
4. Border radius, shadows, opacity
5. Breakpoints, z-index scales

OUTPUT FORMAT: Figma Tokens JSON v2
- Use semantic naming: colors.primary.500, spacing.md
- Group by category and purpose
- Include descriptions when context is clear
- Flag duplicates and suggest consolidation

FILES:
{file_contents}
```

### Quality Checks

- Schema validation against Figma Tokens JSON spec
- Warn about invalid token names, circular references
- Suggest improvements (consolidate similar values, add semantic layers)

---

## Interactive Refinement

### When AI Asks Questions

The AI pauses extraction when encountering:
1. **Ambiguous naming** - Same value in different contexts
2. **Duplicate detection** - Similar but not identical values
3. **Missing semantic layer** - Only raw tokens, no purpose-based aliases
4. **Inconsistent patterns** - Mixed conventions

### Interactive Prompt Examples

```
? Found #3b82f6 used in 15 places across components.
  What should we call this color?

  ○ primary (main brand color)
  ○ accent (secondary highlight)
  ○ info (informational states)
  ○ custom name: ___________

? Detected spacing values: 4, 8, 12, 16, 24, 32, 48, 64px
  Which scale naming should we use?

  ○ T-shirt sizes (xs, sm, md, lg, xl, 2xl, 3xl, 4xl)
  ○ Numeric (100, 200, 300, 400, 600, 800, 1200, 1600)
  ○ Semantic (tiny, small, medium, large, xlarge, xxlarge, huge, massive)

? Found 3 similar blues: #2563eb, #3b82f6, #60a5fa
  How should these be organized?

  ○ Shades: blue-dark, blue-medium, blue-light
  ○ Scale: blue-700, blue-500, blue-300
  ○ Keep separate with custom names
```

### Skip Mode

```bash
token-extractor extract --no-interactive
# Uses AI best judgment for all decisions
```

---

## Output Files

### 1. figma-tokens.json (Primary Output)

Figma Tokens Plugin JSON v2 format:

```json
{
  "$themes": [],
  "$metadata": {
    "tokenSetOrder": ["colors", "spacing", "typography", "effects"]
  },
  "colors": {
    "primary": {
      "50": { "value": "#f0f9ff", "type": "color" },
      "500": { "value": "#0ea5e9", "type": "color" },
      "900": { "value": "#0c4a6e", "type": "color" }
    },
    "semantic": {
      "text": { "value": "{colors.primary.900}", "type": "color" },
      "background": { "value": "{colors.primary.50}", "type": "color" }
    }
  },
  "spacing": {
    "xs": { "value": "4", "type": "spacing" },
    "sm": { "value": "8", "type": "spacing" },
    "md": { "value": "16", "type": "spacing" }
  },
  "typography": {
    "heading": {
      "h1": {
        "value": {
          "fontFamily": "{fontFamilies.primary}",
          "fontSize": "{fontSize.2xl}",
          "lineHeight": "{lineHeight.tight}"
        },
        "type": "typography"
      }
    }
  }
}
```

### 2. figma-tokens-report.md (Summary)

```markdown
# Token Extraction Report

## Summary
✓ Extracted 127 tokens across 4 categories
✓ Found 8 duplicate values (consolidated)
✓ Created 12 semantic aliases

## Breakdown
- Colors: 45 tokens (8 palettes)
- Spacing: 12 tokens
- Typography: 28 tokens (4 families, 7 sizes)
- Effects: 18 tokens (shadows, borders)

## Recommendations
⚠️ Consider consolidating:
  - #1a73e8 and #1976d2 (only 3% different)

💡 Missing tokens:
  - No focus states defined
  - Inconsistent spacing scale (has 8px, 12px, 16px but missing 24px)

## Next Steps
1. Import figma-tokens.json into Figma Tokens plugin
2. Review consolidated tokens
3. Apply to your Figma design system
```

### 3. figma-tokens-cleanup.md (Design System Audit)

This is the bonus value-add that helps teams improve their codebase.

```markdown
# Design System Cleanup Tasks

## Priority 1: Critical Issues (8 tasks)
- [ ] Fix contrast ratio: `colors.text.muted` on `colors.bg.light` (2.8:1 → needs 4.5:1)
- [ ] Consolidate near-duplicate blues: #1a73e8 and #1976d2
- [ ] Replace 47 hard-coded color values with token references

## Priority 2: Inconsistencies (12 tasks)
- [ ] Standardize naming: Convert all tokens to kebab-case
- [ ] Fill spacing scale gaps: Add 24px and 32px tokens
- [ ] Balance color palettes: Add red-200, red-400, red-600

## Priority 3: Enhancements (6 tasks)
- [ ] Add focus state color tokens
- [ ] Define animation timing tokens
- [ ] Create semantic layer for component-specific tokens
```

**What Gets Flagged:**

1. **Inconsistencies:**
   - Palette imbalances (12 blues, 3 reds)
   - Scale gaps (missing values in spacing/typography)
   - Mixed naming conventions

2. **Duplicates/Near-Duplicates:**
   - Colors within 5% similarity
   - Recommendation to consolidate

3. **Hard-coded Values:**
   - Count by file
   - Should reference tokens instead

4. **Missing Token Categories:**
   - Focus states, animations, breakpoints

5. **Accessibility Issues:**
   - Color contrast ratios below WCAG standards
   - Font sizes below 12px

---

## Error Handling

### Graceful Failures

- **API rate limits:** Pause and retry with exponential backoff
- **Invalid files:** Skip and log, continue processing
- **Context overflow:** Auto-switch to batched processing
- **AI timeout:** Save progress, allow resume

### Resume Capability

```bash
token-extractor extract --resume
# Picks up from last checkpoint
```

### Validation

- Schema validation before writing output
- Warn if token names conflict with Figma reserved words
- Check for circular token references

---

## Technical Stack

### Core Dependencies

```json
{
  "dependencies": {
    "commander": "^11.0.0",
    "inquirer": "^9.0.0",
    "@anthropic-ai/sdk": "^0.20.0",
    "openai": "^4.0.0",
    "fast-glob": "^3.3.0",
    "postcss": "^8.4.0",
    "postcss-scss": "^4.0.0",
    "@babel/parser": "^7.23.0",
    "chalk": "^5.3.0",
    "ora": "^7.0.0"
  }
}
```

### Project Structure

```
src/
  commands/
    extract.ts              # Main extract command
  discovery/
    scanner.ts              # Repo structure analysis
    framework-detector.ts   # Identify CSS frameworks
  analysis/
    modes/
      quick.ts              # Hybrid AST + AI
      balanced.ts           # Single-pass AI
      thorough.ts           # Multi-pass pipeline
    ai-client.ts            # AI provider abstraction
  extraction/
    prompts/                # AI prompt templates
    parsers/                # AST parsers (PostCSS, Babel)
  interactive/
    questions.ts            # Question generation
  output/
    figma-tokens.ts         # JSON generator
    report.ts               # Report generator
    cleanup.ts              # Audit generator
  config/
    api-keys.ts             # API key management
  types/
    tokens.ts               # Token type definitions
    figma-tokens.ts         # Figma Tokens JSON schema
```

---

## User Experience

### CLI Commands

```bash
# Primary command
token-extractor extract

# With options
token-extractor extract --mode balanced
token-extractor extract --no-interactive
token-extractor extract --resume
token-extractor extract --output ./my-tokens.json

# Help
token-extractor --help
token-extractor extract --help
```

### Progress Indicators

```
⣾ Analyzing repository structure...
✓ Discovered 47 files (2.3s)

⣾ Extracting tokens (Balanced Mode)...
  ├─ Processing components/Button.tsx... ✓
  ├─ Processing styles/colors.scss... ✓
  ├─ Processing theme.js... ⣾
  └─ 24/47 files complete

? AI needs your input (3 questions remaining)

⣾ Generating Figma Tokens JSON...
✓ Extraction complete! (45.2s, $0.68)

📄 Files written:
   • figma-tokens.json (ready for Figma Tokens plugin)
   • figma-tokens-report.md (extraction summary)
   • figma-tokens-cleanup.md (design system audit)
```

---

## Implementation Phases

### Phase 1: Core CLI Scaffolding
- Commander.js setup
- Config file management
- API key handling (env vars, config file, prompt)
- Basic error handling

### Phase 2: Discovery Engine
- File scanning with fast-glob
- Framework detection (CSS/SCSS/JS patterns)
- Metrics calculation
- Recommendation algorithm

### Phase 3: Quick Mode
- PostCSS parser for CSS/SCSS
- Babel parser for JavaScript theme objects
- Regex-based value extraction
- Light AI integration for naming

### Phase 4: Balanced Mode
- File batching strategy
- Single-pass AI prompt engineering
- Token extraction from diverse patterns
- Cost optimization

### Phase 5: Thorough Mode
- Multi-pass pipeline implementation
- Pattern detection across files
- Semantic grouping logic
- Alias generation

### Phase 6: Interactive System
- Inquirer.js integration
- AI-generated questions
- User input handling
- Skip mode implementation

### Phase 7: Output Generation
- Figma Tokens JSON writer (v2 spec)
- Schema validation
- Report generator
- Backup/raw data output

### Phase 8: Audit System
- Inconsistency detection
- Duplicate finder (color similarity algorithms)
- Hard-coded value counter
- Accessibility checker (contrast ratios)
- Cleanup task prioritization

### Phase 9: Error Handling & Resume
- API rate limit handling
- Progress checkpointing
- Resume capability
- Graceful degradation

### Phase 10: Testing & Documentation
- Test against various repos (React, Vue, vanilla)
- Test different frameworks (Tailwind, styled-components, CSS Modules)
- README with examples
- Troubleshooting guide
- Cost estimation accuracy testing

---

## Success Metrics

- ✅ Accurately extracts 80%+ of design tokens across diverse codebases
- ✅ Outputs valid Figma Tokens JSON v2 format (passes schema validation)
- ✅ Provides intelligent naming following Figma Tokens conventions
- ✅ Works with Tailwind, styled-components, CSS Modules, vanilla CSS/SCSS
- ✅ Generates actionable design system improvement recommendations
- ✅ Cost estimates accurate within 20%
- ✅ Mode recommendations appropriate for 90%+ of repositories

---

## Future Enhancements (Out of Scope for V1)

1. **Component Token Extraction:** Extract component-specific tokens (button sizes, card padding)
2. **Visual Diff:** Show before/after of token consolidation
3. **Auto-Apply:** Option to refactor codebase to use extracted tokens
4. **CI/CD Integration:** Run as part of design system audit pipeline
5. **Figma API Direct Upload:** Skip manual import step
6. **Multi-Repo Analysis:** Extract tokens from multiple related repos
7. **Token Usage Heatmap:** Show which tokens are used where
8. **Migration Guides:** Generate refactoring guides for cleanup tasks

---

## Related Context

This tool complements Handoff's existing workflow:
- **Handoff:** Figma → Code (design tokens from Figma API to code)
- **Token Extractor:** Code → Figma (design tokens from code to Figma)

Together, they enable bidirectional design-code synchronization.

---

## Questions & Decisions Log

**Q:** Should this be a separate package or part of Handoff?
**A:** Separate package (`@handoff/token-extractor`) for standalone use, but within Handoff monorepo/ecosystem

**Q:** Which AI provider to prioritize?
**A:** Support both Anthropic (Claude) and OpenAI (GPT-4), let user choose. Claude recommended for code analysis.

**Q:** How to handle large repos that exceed context limits?
**A:** Auto-switch to Thorough mode (multi-pass) or batched processing

**Q:** Should we support other output formats besides Figma Tokens?
**A:** V1 focuses on Figma Tokens plugin. V2 could add Style Dictionary, CSS variables, etc.

---

## Approval

**Approved by:** Matt Bernier
**Date:** 2025-11-10
**Next Step:** Worktree setup and implementation planning
