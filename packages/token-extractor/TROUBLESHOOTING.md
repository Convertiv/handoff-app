# Troubleshooting Guide

This guide covers common issues you might encounter when using Token Extractor and their solutions.

## Table of Contents

- [API Key Issues](#api-key-issues)
- [File Parsing Errors](#file-parsing-errors)
- [AI Timeout and Rate Limits](#ai-timeout-and-rate-limits)
- [Output Validation Errors](#output-validation-errors)
- [Discovery Issues](#discovery-issues)
- [Installation Problems](#installation-problems)
- [Common Questions](#common-questions)

## API Key Issues

### No API Key Found

**Error:**
```
⚠️  No API key found
You need an API key from Anthropic or OpenAI to use this tool.
```

**Solution:**

1. **Set environment variable** (recommended for CI/CD):
   ```bash
   export ANTHROPIC_API_KEY="sk-ant-..."
   # or
   export OPENAI_API_KEY="sk-..."
   ```

2. **Use interactive prompt** (recommended for local development):
   - Simply run the tool without a key
   - Follow the prompts to enter and save your key

3. **Create config file** manually:
   ```bash
   echo '{"anthropicApiKey": "sk-ant-..."}' > ~/.token-extractor.config.json
   chmod 600 ~/.token-extractor.config.json
   ```

### Invalid API Key

**Error:**
```
Error: API request failed: 401 Unauthorized
Invalid API key provided
```

**Solutions:**

1. **Check key format**:
   - Anthropic keys start with `sk-ant-`
   - OpenAI keys start with `sk-`
   - Ensure there are no extra spaces or quotes

2. **Verify key is active**:
   - Visit your provider's console
   - Check if the key hasn't been revoked
   - Generate a new key if needed

3. **Clear cached config**:
   ```bash
   rm ~/.token-extractor.config.json
   # Then re-run with new key
   ```

### API Key Permission Issues

**Error:**
```
Warning: Could not set file permissions on ~/.token-extractor.config.json
```

**Solution:**

This is usually a warning, not an error. The tool works fine but the config file permissions couldn't be restricted.

On **Unix/macOS**:
```bash
chmod 600 ~/.token-extractor.config.json
```

On **Windows**:
- Right-click the file → Properties → Security
- Remove permissions for all users except yourself

### Wrong Provider Selected

**Error:**
```
Error: Failed to create AI client: Invalid provider
```

**Solution:**

Ensure your API key matches the provider being used. The tool auto-detects based on environment variables, but you can force a provider:

1. **Clear existing config**:
   ```bash
   rm ~/.token-extractor.config.json
   unset ANTHROPIC_API_KEY
   unset OPENAI_API_KEY
   ```

2. **Set only the key you want to use**:
   ```bash
   export ANTHROPIC_API_KEY="sk-ant-..."
   ```

## File Parsing Errors

### Cannot Read File

**Error:**
```
Warning: Could not read file /path/to/file.css
```

**Causes & Solutions:**

1. **File doesn't exist**:
   - Check the file path is correct
   - Ensure file wasn't moved or deleted

2. **Permission denied**:
   ```bash
   chmod +r /path/to/file.css
   ```

3. **Binary file or encoding issue**:
   - The tool only reads text files (CSS, JS, TS, etc.)
   - Check file encoding is UTF-8

### Syntax Error in File

**Error:**
```
Error: Failed to parse /path/to/file.js
Unexpected token at line 42
```

**Solutions:**

1. **Check file syntax**:
   - Run your project's linter: `npm run lint`
   - Fix any syntax errors in the file

2. **File uses unsupported features**:
   - Some experimental JavaScript features may not parse
   - Try using Quick mode (skips detailed AST parsing)

3. **Exclude problematic files**:
   - Move them outside scanned directories
   - Or add exclusion patterns (future feature)

### PostCSS/SCSS Parsing Errors

**Error:**
```
Error: Failed to parse SCSS at /path/to/styles.scss
Unknown word at line 15
```

**Solutions:**

1. **Check SCSS syntax**:
   ```bash
   npx sass /path/to/styles.scss --no-source-map
   ```

2. **Use Balanced mode instead**:
   - Balanced mode reads raw content, doesn't parse AST
   - More forgiving of syntax variations

3. **Update dependencies**:
   ```bash
   cd /path/to/token-extractor
   npm update postcss postcss-scss
   ```

## AI Timeout and Rate Limits

### Request Timeout

**Error:**
```
Error: AI request timed out after 60000ms
```

**Solutions:**

1. **Use a smaller mode**:
   - Switch from Thorough to Balanced
   - Switch from Balanced to Quick

2. **Reduce file count**:
   - Process only essential directories
   - Split extraction into multiple runs

3. **Check network connection**:
   - Ensure stable internet connection
   - Try again from a different network

4. **Increase timeout** (advanced):
   - Modify `ai-client.ts` timeout settings
   - Not recommended without good reason

### Rate Limit Exceeded

**Error:**
```
Error: Rate limit exceeded
Too many requests. Please try again later.
```

**Solutions:**

1. **Wait and retry**:
   - Anthropic: Wait 1 minute, then retry
   - OpenAI: Wait 1-5 minutes, then retry

2. **Check usage tier**:
   - Free tier has strict rate limits
   - Upgrade to paid tier for higher limits

3. **Use Quick mode**:
   - Makes fewer, smaller requests
   - Less likely to hit rate limits

4. **Batch processing**:
   - Process subdirectories separately
   - Combine results manually

### Token Limit Exceeded

**Error:**
```
Error: Request exceeds maximum token limit
```

**Solutions:**

1. **Use Quick mode**:
   - Sends minimal context to AI
   - Works for most projects

2. **Reduce file count**:
   - Process fewer files at once
   - Use more targeted directories

3. **Use Balanced mode with smaller batches**:
   - Balanced mode automatically batches files
   - May need multiple runs for very large projects

## Output Validation Errors

### Invalid Token Format

**Error:**
```
Error: Output validation failed
Token "colors.primary" has invalid value format
```

**Solutions:**

1. **Check AI response quality**:
   - The AI may have generated malformed tokens
   - Try running again (responses vary)

2. **Use different mode**:
   - Thorough mode produces more consistent output
   - Quick mode may miss validation edge cases

3. **Manual cleanup**:
   - Edit `figma-tokens.json` to fix invalid tokens
   - Refer to [Figma Tokens documentation](https://docs.tokens.studio/)

### Missing Required Fields

**Error:**
```
Error: Token missing required field: "value"
```

**Solutions:**

1. **Re-run extraction**:
   - AI responses are non-deterministic
   - A second run usually fixes it

2. **Check source files**:
   - Ensure tokens in code are well-formed
   - Fix any incomplete token definitions

3. **Use Thorough mode**:
   - Multi-pass analysis catches more edge cases
   - Better at handling incomplete tokens

### Invalid JSON Output

**Error:**
```
Error: Failed to parse AI response as JSON
Unexpected token at position 1234
```

**Solutions:**

1. **Re-run extraction**:
   - AI occasionally returns malformed JSON
   - Usually works on retry

2. **Check AI provider status**:
   - Visit status page (status.anthropic.com or status.openai.com)
   - Provider may be experiencing issues

3. **Switch providers**:
   - If Anthropic fails, try OpenAI (or vice versa)
   - Different models handle formatting differently

## Discovery Issues

### No Files Found

**Error:**
```
Found 0 files (0 lines)
No tokens to extract
```

**Solutions:**

1. **Check current directory**:
   ```bash
   pwd
   # Should be your project root, not package directory
   cd /path/to/your/project
   ```

2. **Verify file structure**:
   ```bash
   ls -la
   # Should see src/, styles/, components/, etc.
   ```

3. **Check for expected patterns**:
   - Tool looks in `src/`, `styles/`, `components/`, `theme/`, `tokens/`
   - Ensure your project uses these directories

4. **Manual file specification** (future feature):
   - Currently auto-discovery only
   - Can manually specify directories in code

### Wrong Framework Detected

**Error:**
```
Frameworks: unknown
Expected: react
```

**Solutions:**

1. **Check package.json**:
   - Ensure framework dependencies are listed
   - Example: `"react": "^18.0.0"`

2. **Framework detection is informational only**:
   - Doesn't affect extraction
   - Used only for recommendations

3. **Ignore if extraction works**:
   - Framework detection helps with mode selection
   - Not critical if tokens extract successfully

## Installation Problems

### Command Not Found

**Error:**
```
bash: token-extractor: command not found
```

**Solutions:**

1. **Install globally**:
   ```bash
   npm install -g @handoff/token-extractor
   ```

2. **Use npx**:
   ```bash
   npx @handoff/token-extractor extract
   ```

3. **Use local installation**:
   ```bash
   npm install @handoff/token-extractor
   npx token-extractor extract
   ```

4. **Check PATH**:
   ```bash
   echo $PATH
   # Should include npm global bin directory
   npm config get prefix
   ```

### Dependency Conflicts

**Error:**
```
npm ERR! peer dependency conflict
```

**Solutions:**

1. **Use --force flag**:
   ```bash
   npm install --force @handoff/token-extractor
   ```

2. **Use --legacy-peer-deps**:
   ```bash
   npm install --legacy-peer-deps @handoff/token-extractor
   ```

3. **Update npm**:
   ```bash
   npm install -g npm@latest
   ```

4. **Clean install**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

### TypeScript Errors

**Error:**
```
Error: Cannot find module '@types/node'
```

**Solutions:**

1. **Install dev dependencies**:
   ```bash
   npm install
   ```

2. **If developing locally**:
   ```bash
   cd packages/token-extractor
   npm install
   npm run build
   ```

3. **Check Node version**:
   ```bash
   node --version
   # Should be 18.x or higher
   nvm use 18
   ```

## Common Questions

### Q: How much does extraction cost?

**A:** Costs depend on the analysis mode:
- **Quick mode**: $0.10-$0.50 per run
- **Balanced mode**: $0.50-$1.50 per run
- **Thorough mode**: $1.00-$5.00 per run

Costs scale with codebase size. A typical React app (~3000 lines) costs $0.85 in Balanced mode.

### Q: Can I use this without an AI API?

**A:** No, Token Extractor requires AI to intelligently identify and organize tokens. AST parsing alone can't handle the diverse patterns found in real codebases.

However:
- API keys are free to create
- Free tiers often cover several extractions
- Cost per extraction is typically under $2

### Q: How accurate are the extracted tokens?

**A:** Accuracy depends on mode:
- **Quick**: ~75% (may miss complex patterns)
- **Balanced**: ~85% (good for most projects)
- **Thorough**: ~95% (catches nearly everything)

We recommend:
1. Start with Balanced mode
2. Review the generated `token-extraction-report.md`
3. Manually adjust `figma-tokens.json` if needed
4. Re-run with Thorough mode if results aren't satisfactory

### Q: My tokens have weird names. How do I fix them?

**A:** Token naming is AI-generated and may not match your conventions.

**Solutions:**
1. **Edit manually**: Open `figma-tokens.json` and rename tokens
2. **Re-run extraction**: AI responses vary; try again
3. **Use Thorough mode**: Better at semantic naming
4. **Provide better source naming**: Clean up variable names in code first

### Q: Can I extract from multiple projects?

**A:** Yes, but run separately for each project:

```bash
cd project-1
token-extractor extract -o ./tokens/project-1.json

cd ../project-2
token-extractor extract -o ./tokens/project-2.json
```

You can then manually merge the JSON files if needed.

### Q: Does this work with Tailwind CSS?

**A:** Partially. Token Extractor can:
- Extract custom Tailwind config values
- Identify custom color/spacing scales
- Find theme customizations

However:
- Default Tailwind classes (like `bg-blue-500`) aren't extracted
- Tailwind already provides a comprehensive token system
- Best used when you have custom Tailwind configuration

### Q: How do I update tokens when code changes?

**A:** Simply re-run the extraction:

```bash
token-extractor extract -o ./figma-tokens.json
```

The tool overwrites the output file. To preserve manual edits:

1. Save a copy of your edited tokens
2. Run extraction to get new tokens
3. Manually merge the two files

Or use version control:
```bash
git diff figma-tokens.json
# Review changes before committing
```

### Q: Can I automate this in CI/CD?

**A:** Yes! See [README.md - Example 3: CI/CD Integration](./README.md#example-3-cicd-integration) for a complete GitHub Actions example.

Key points:
- Store API key in repository secrets
- Use `--no-interactive` flag
- Commit generated tokens automatically

### Q: The tool is slow. How can I speed it up?

**A:** Try these approaches:

1. **Use Quick mode**:
   ```bash
   token-extractor extract --mode quick
   ```

2. **Reduce scope**:
   - Process only essential directories
   - Exclude test files

3. **Check network**:
   - Slow internet affects AI API calls
   - Use wired connection if possible

4. **Batch smaller projects**:
   - Thorough mode is slow for large codebases
   - Use Balanced for faster results

### Q: Can I contribute improvements?

**A:** Absolutely! See [README.md - Contributing](./README.md#contributing) for details.

Areas we'd love help with:
- Better framework detection
- More file format support
- Improved error messages
- Additional output formats
- Documentation improvements

### Q: My question isn't answered here

**A:** Get help from:
- **GitHub Issues**: [handoff/issues](https://github.com/Convertiv/handoff/issues)
- **GitHub Discussions**: [handoff/discussions](https://github.com/Convertiv/handoff/discussions)
- **Documentation**: [handoff.com/docs](https://www.handoff.com/docs)

When reporting issues, include:
1. Full error message
2. Token Extractor version: `token-extractor --version`
3. Node version: `node --version`
4. Operating system
5. Minimal reproduction steps

---

**Still having trouble?** [Open an issue](https://github.com/Convertiv/handoff/issues/new) with details about your problem.
