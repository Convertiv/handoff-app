# CI/CD Integration Example

This example shows how to automate token extraction in your CI/CD pipeline.

## Overview

Automate token extraction whenever design tokens change in your codebase, ensuring your `figma-tokens.json` stays in sync with your code.

## Benefits

- Automatic updates when tokens change
- No manual extraction required
- Version controlled token history
- Consistent token generation
- Team synchronization

## GitHub Actions Example

### Complete Workflow

Create `.github/workflows/extract-tokens.yml`:

```yaml
name: Extract Design Tokens

on:
  # Run on pushes to main that affect token files
  push:
    branches: [main, develop]
    paths:
      - 'src/**/*.css'
      - 'src/**/*.scss'
      - 'src/theme/**'
      - 'src/styles/**'
      - 'src/tokens/**'

  # Allow manual triggering
  workflow_dispatch:

  # Run on pull requests to preview changes
  pull_request:
    paths:
      - 'src/**/*.css'
      - 'src/**/*.scss'
      - 'src/theme/**'

jobs:
  extract-tokens:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3
        with:
          # Needed to push changes back
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Extract tokens
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          npx @handoff/token-extractor extract \
            --mode balanced \
            --no-interactive \
            -o ./design-system/figma-tokens.json

      - name: Check for changes
        id: git-check
        run: |
          git diff --exit-code ./design-system/figma-tokens.json || echo "changed=true" >> $GITHUB_OUTPUT

      - name: Commit and push changes
        if: steps.git-check.outputs.changed == 'true'
        run: |
          git config --local user.name "Token Extractor Bot"
          git config --local user.email "bot@yourdomain.com"
          git add ./design-system/figma-tokens.json
          git commit -m "chore: update design tokens [skip ci]"
          git push

      - name: Upload tokens as artifact
        uses: actions/upload-artifact@v3
        with:
          name: figma-tokens
          path: ./design-system/figma-tokens.json
          retention-days: 30
```

### Setting Up Secrets

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add `ANTHROPIC_API_KEY` with your API key value

### Configuration Options

#### Run on specific branches only

```yaml
on:
  push:
    branches:
      - main
      - develop
      - 'release/**'
```

#### Run on schedule (nightly)

```yaml
on:
  schedule:
    # Run every night at 2 AM UTC
    - cron: '0 2 * * *'
```

#### Skip commits on push

Add `[skip ci]` to commit messages to prevent recursive runs:

```yaml
- name: Commit changes
  run: |
    git commit -m "chore: update design tokens [skip ci]"
```

## GitLab CI Example

Create `.gitlab-ci.yml`:

```yaml
extract-tokens:
  stage: deploy
  image: node:18

  only:
    changes:
      - src/**/*.css
      - src/**/*.scss
      - src/theme/**

  variables:
    ANTHROPIC_API_KEY: $ANTHROPIC_API_KEY

  before_script:
    - npm ci

  script:
    - npx @handoff/token-extractor extract --mode balanced --no-interactive -o ./design-system/figma-tokens.json
    - |
      if git diff --exit-code ./design-system/figma-tokens.json; then
        echo "No changes to tokens"
      else
        git config --global user.name "Token Extractor Bot"
        git config --global user.email "bot@yourdomain.com"
        git add ./design-system/figma-tokens.json
        git commit -m "chore: update design tokens [skip ci]"
        git push https://oauth2:${CI_PUSH_TOKEN}@${CI_SERVER_HOST}/${CI_PROJECT_PATH}.git HEAD:${CI_COMMIT_REF_NAME}
      fi

  artifacts:
    paths:
      - ./design-system/figma-tokens.json
    expire_in: 30 days
```

### GitLab CI Variables

1. Go to **Settings** → **CI/CD** → **Variables**
2. Add `ANTHROPIC_API_KEY` (protected, masked)
3. Add `CI_PUSH_TOKEN` (project access token with write permissions)

## CircleCI Example

Create `.circleci/config.yml`:

```yaml
version: 2.1

jobs:
  extract-tokens:
    docker:
      - image: cimg/node:18.0

    steps:
      - checkout

      - restore_cache:
          keys:
            - npm-deps-{{ checksum "package-lock.json" }}

      - run:
          name: Install dependencies
          command: npm ci

      - save_cache:
          key: npm-deps-{{ checksum "package-lock.json" }}
          paths:
            - node_modules

      - run:
          name: Extract design tokens
          command: |
            npx @handoff/token-extractor extract \
              --mode balanced \
              --no-interactive \
              -o ./design-system/figma-tokens.json

      - run:
          name: Commit changes
          command: |
            git config user.name "Token Extractor Bot"
            git config user.email "bot@yourdomain.com"

            if git diff --exit-code ./design-system/figma-tokens.json; then
              echo "No changes to tokens"
            else
              git add ./design-system/figma-tokens.json
              git commit -m "chore: update design tokens [skip ci]"
              git push origin $CIRCLE_BRANCH
            fi

      - store_artifacts:
          path: ./design-system/figma-tokens.json
          destination: tokens

workflows:
  extract-on-change:
    jobs:
      - extract-tokens:
          filters:
            branches:
              only:
                - main
                - develop
```

### CircleCI Environment Variables

1. Go to **Project Settings** → **Environment Variables**
2. Add `ANTHROPIC_API_KEY`

## Pull Request Preview

Get token changes previewed in PRs without committing:

```yaml
name: Preview Token Changes

on:
  pull_request:
    paths:
      - 'src/**/*.css'
      - 'src/**/*.scss'
      - 'src/theme/**'

jobs:
  preview-tokens:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - run: npm ci

      - name: Extract tokens
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          npx @handoff/token-extractor extract \
            --mode balanced \
            --no-interactive \
            -o ./figma-tokens.json

      - name: Generate diff
        run: |
          git diff ./figma-tokens.json > token-changes.diff || true

      - name: Comment on PR
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const diff = fs.readFileSync('token-changes.diff', 'utf8');

            if (diff.length === 0) {
              await github.rest.issues.createComment({
                issue_number: context.issue.number,
                owner: context.repo.owner,
                repo: context.repo.repo,
                body: '✅ No changes to design tokens'
              });
            } else {
              await github.rest.issues.createComment({
                issue_number: context.issue.number,
                owner: context.repo.owner,
                repo: context.repo.repo,
                body: `## Design Token Changes\n\n\`\`\`diff\n${diff.slice(0, 5000)}\n\`\`\``
              });
            }

      - name: Upload preview
        uses: actions/upload-artifact@v3
        with:
          name: token-preview
          path: ./figma-tokens.json
```

## NPM Scripts Integration

Add to your `package.json`:

```json
{
  "scripts": {
    "tokens:extract": "token-extractor extract --mode balanced --no-interactive",
    "tokens:extract:quick": "token-extractor extract --mode quick --no-interactive",
    "tokens:extract:thorough": "token-extractor extract --mode thorough --no-interactive",
    "tokens:check": "token-extractor extract --mode balanced --no-interactive && git diff --exit-code ./figma-tokens.json",
    "precommit": "npm run tokens:extract",
    "postinstall": "npm run tokens:extract"
  }
}
```

## Husky Pre-commit Hook

Automatically extract tokens before commits:

### Install Husky

```bash
npm install --save-dev husky
npx husky install
```

### Add Pre-commit Hook

```bash
npx husky add .husky/pre-commit "npm run tokens:extract"
```

### .husky/pre-commit

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

echo "Extracting design tokens..."
npm run tokens:extract

# Add generated file to commit
git add ./design-system/figma-tokens.json
```

## Docker Integration

### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Run extraction
ENV ANTHROPIC_API_KEY=""
CMD ["npx", "@handoff/token-extractor", "extract", "--mode", "balanced", "--no-interactive"]
```

### Usage

```bash
docker build -t token-extractor .
docker run -e ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" -v $(pwd):/app token-extractor
```

## Best Practices

### 1. Choose the Right Trigger

- **Push to main**: Keep tokens in sync automatically
- **Pull request**: Preview changes before merge
- **Schedule**: Periodic updates for catch-up
- **Manual**: On-demand extraction

### 2. Manage API Costs

```yaml
# Only run on token file changes
on:
  push:
    paths:
      - 'src/theme/**'
      - 'src/styles/**'
```

### 3. Handle Failures Gracefully

```yaml
- name: Extract tokens
  continue-on-error: true
  run: npx @handoff/token-extractor extract --mode balanced --no-interactive

- name: Notify on failure
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    text: 'Token extraction failed'
```

### 4. Version Control

```yaml
- name: Tag release
  if: github.ref == 'refs/heads/main'
  run: |
    git tag "tokens-$(date +%Y%m%d-%H%M%S)"
    git push --tags
```

### 5. Cache Dependencies

```yaml
- name: Cache node modules
  uses: actions/cache@v3
  with:
    path: node_modules
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
```

## Monitoring and Alerts

### Slack Notification

```yaml
- name: Notify Slack
  if: success()
  uses: 8398a7/action-slack@v3
  with:
    status: custom
    custom_payload: |
      {
        text: "✅ Design tokens updated successfully",
        attachments: [{
          color: 'good',
          text: `Commit: ${{ github.sha }}\nAuthor: ${{ github.actor }}`
        }]
      }
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

### Discord Notification

```yaml
- name: Discord notification
  uses: Ilshidur/action-discord@master
  with:
    args: 'Design tokens updated: ${{ github.event.head_commit.message }}'
  env:
    DISCORD_WEBHOOK: ${{ secrets.DISCORD_WEBHOOK }}
```

## Cost Management

Track API usage by logging costs:

```yaml
- name: Log extraction cost
  run: |
    echo "Mode: balanced" >> token-extraction.log
    echo "Files: $(find src -name '*.css' -o -name '*.scss' | wc -l)" >> token-extraction.log
    echo "Date: $(date)" >> token-extraction.log

    # Estimate cost (rough calculation)
    FILES=$(find src -name '*.css' -o -name '*.scss' | wc -l)
    COST=$(echo "scale=2; $FILES * 0.02" | bc)
    echo "Estimated cost: \$$COST" >> token-extraction.log
```

## Troubleshooting CI/CD

### Issue: API key not found

**Solution**: Verify secrets are set correctly and accessible to workflow.

```yaml
- name: Debug secrets
  run: |
    if [ -z "$ANTHROPIC_API_KEY" ]; then
      echo "ERROR: ANTHROPIC_API_KEY not set"
      exit 1
    fi
```

### Issue: Permission denied on push

**Solution**: Use a personal access token with write permissions.

```yaml
- uses: actions/checkout@v3
  with:
    token: ${{ secrets.PAT_TOKEN }}
```

### Issue: Excessive runs

**Solution**: Add `[skip ci]` to commit messages and use more specific path filters.

---

For more examples and updates, see the [GitHub repository](https://github.com/Convertiv/handoff).
