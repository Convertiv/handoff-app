import * as fs from 'fs';
import * as path from 'path';
import glob from 'fast-glob';

export type Framework =
  | 'tailwind'
  | 'styled-components'
  | 'emotion'
  | 'scss'
  | 'less'
  | 'css-modules'
  | 'chakra'
  | 'material-ui'
  | 'ant-design'
  | 'react'
  | 'vue'
  | 'angular';

export class FrameworkDetector {
  private rootDir: string;

  constructor(rootDir: string = process.cwd()) {
    this.rootDir = rootDir;
  }

  /**
   * Detect all frameworks/libraries used in the project
   */
  async detect(): Promise<Framework[]> {
    const frameworks: Set<Framework> = new Set();

    // Check package.json dependencies
    const packageFrameworks = await this.detectFromPackageJson();
    packageFrameworks.forEach(f => frameworks.add(f));

    // Check config files
    const configFrameworks = await this.detectFromConfigFiles();
    configFrameworks.forEach(f => frameworks.add(f));

    // Check file extensions
    const fileFrameworks = await this.detectFromFiles();
    fileFrameworks.forEach(f => frameworks.add(f));

    return Array.from(frameworks);
  }

  private async detectFromPackageJson(): Promise<Framework[]> {
    const frameworks: Framework[] = [];
    const packageJsonPath = path.join(this.rootDir, 'package.json');

    if (!fs.existsSync(packageJsonPath)) {
      return frameworks;
    }

    try {
      const content = await fs.promises.readFile(packageJsonPath, 'utf-8');
      const pkg = JSON.parse(content);
      const allDeps = {
        ...pkg.dependencies,
        ...pkg.devDependencies
      };

      if (allDeps['styled-components']) frameworks.push('styled-components');
      if (allDeps['@emotion/react'] || allDeps['@emotion/styled']) frameworks.push('emotion');
      if (allDeps['@chakra-ui/react']) frameworks.push('chakra');
      if (allDeps['@mui/material']) frameworks.push('material-ui');
      if (allDeps['antd']) frameworks.push('ant-design');
      if (allDeps['react']) frameworks.push('react');
      if (allDeps['vue']) frameworks.push('vue');
      if (allDeps['@angular/core']) frameworks.push('angular');
      if (allDeps['tailwindcss']) frameworks.push('tailwind');
    } catch (error) {
      // Invalid package.json
    }

    return frameworks;
  }

  private async detectFromConfigFiles(): Promise<Framework[]> {
    const frameworks: Framework[] = [];

    // Tailwind
    const tailwindConfigs = ['tailwind.config.js', 'tailwind.config.ts', 'tailwind.config.cjs'];
    if (tailwindConfigs.some(f => fs.existsSync(path.join(this.rootDir, f)))) {
      frameworks.push('tailwind');
    }

    return frameworks;
  }

  private async detectFromFiles(): Promise<Framework[]> {
    const frameworks: Framework[] = [];

    const files = await glob(['**/*.{scss,sass,less,css}'], {
      cwd: this.rootDir,
      ignore: ['**/node_modules/**', '**/dist/**'],
      absolute: false
    });

    if (files.some(f => f.endsWith('.scss') || f.endsWith('.sass'))) {
      frameworks.push('scss');
    }

    if (files.some(f => f.endsWith('.less'))) {
      frameworks.push('less');
    }

    // Check for CSS Modules
    if (files.some(f => f.includes('.module.css'))) {
      frameworks.push('css-modules');
    }

    return frameworks;
  }

  /**
   * Check if project has existing token infrastructure
   */
  async hasExistingTokens(): Promise<boolean> {
    const tokenFiles = await glob(
      ['**/tokens.json', '**/design-tokens.json', '**/*tokens*.{js,ts}'],
      {
        cwd: this.rootDir,
        ignore: ['**/node_modules/**'],
        absolute: false
      }
    );

    if (tokenFiles.length > 0) return true;

    // Check for CSS custom properties
    const cssFiles = await glob(['**/*.css', '**/*.scss'], {
      cwd: this.rootDir,
      ignore: ['**/node_modules/**'],
      absolute: true
    });

    for (const file of cssFiles.slice(0, 10)) { // Sample first 10 files
      const content = await fs.promises.readFile(file, 'utf-8');
      if (content.includes('--') || content.includes('$')) {
        return true;
      }
    }

    return false;
  }
}
