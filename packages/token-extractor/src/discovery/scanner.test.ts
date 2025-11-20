import { FileScanner } from './scanner';
import * as fs from 'fs';
import * as path from 'path';

describe('FileScanner', () => {
  const testDir = path.join(__dirname, '../../test-fixtures/sample-repo');

  beforeAll(() => {
    // Create test fixtures
    fs.mkdirSync(testDir, { recursive: true });
    fs.mkdirSync(path.join(testDir, 'src/styles'), { recursive: true });
    fs.writeFileSync(path.join(testDir, 'src/styles/colors.scss'), '$primary: #0ea5e9;');
    fs.writeFileSync(path.join(testDir, 'src/Button.tsx'), 'const Button = () => <button />;');
  });

  afterAll(() => {
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  test('should scan directory and find style files', async () => {
    const scanner = new FileScanner(testDir);
    const files = await scanner.findStyleFiles();
    expect(files.length).toBeGreaterThan(0);
    expect(files.some((f: string) => f.endsWith('.scss'))).toBe(true);
  });

  test('should count total lines', async () => {
    const scanner = new FileScanner(testDir);
    const lineCount = await scanner.countLines();
    expect(lineCount).toBeGreaterThan(0);
  });

  test('should respect exclude patterns', async () => {
    const scanner = new FileScanner(testDir, {
      exclude: ['**/*.tsx']
    });
    const files = await scanner.findStyleFiles();
    expect(files.every((f: string) => !f.endsWith('.tsx'))).toBe(true);
  });
});
