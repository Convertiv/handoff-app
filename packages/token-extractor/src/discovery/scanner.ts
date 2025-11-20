import glob from 'fast-glob';
import * as fs from 'fs';
import * as path from 'path';

export interface ScanOptions {
  include?: string[];
  exclude?: string[];
}

export class FileScanner {
  private rootDir: string;
  private options: ScanOptions;

  constructor(rootDir: string = process.cwd(), options: ScanOptions = {}) {
    this.rootDir = rootDir;
    this.options = {
      include: options.include || [
        '**/*.css',
        '**/*.scss',
        '**/*.less',
        '**/*.sass',
        '**/*.js',
        '**/*.jsx',
        '**/*.ts',
        '**/*.tsx',
        '**/*.vue'
      ],
      exclude: options.exclude || [
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/.next/**',
        '**/coverage/**'
      ]
    };
  }

  /**
   * Find all style-related files
   */
  async findStyleFiles(): Promise<string[]> {
    const files = await glob(this.options.include!, {
      cwd: this.rootDir,
      ignore: this.options.exclude,
      absolute: true
    });

    return files;
  }

  /**
   * Count total lines across all files
   */
  async countLines(): Promise<number> {
    const files = await this.findStyleFiles();
    let totalLines = 0;

    for (const file of files) {
      const content = await fs.promises.readFile(file, 'utf-8');
      totalLines += content.split('\n').length;
    }

    return totalLines;
  }

  /**
   * Get file count by type
   */
  async getFileStats(): Promise<Record<string, number>> {
    const files = await this.findStyleFiles();
    const stats: Record<string, number> = {};

    for (const file of files) {
      const ext = path.extname(file);
      stats[ext] = (stats[ext] || 0) + 1;
    }

    return stats;
  }
}
