import { FrameworkDetector } from './framework-detector';
import * as fs from 'fs';
import * as path from 'path';

describe('FrameworkDetector', () => {
  const testDir = path.join(__dirname, '../../test-fixtures/framework-detection');

  beforeAll(() => {
    fs.mkdirSync(testDir, { recursive: true });
  });

  afterAll(() => {
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  test('should detect Tailwind from config', async () => {
    fs.writeFileSync(
      path.join(testDir, 'tailwind.config.js'),
      'module.exports = { content: ["./src/**/*.{js,jsx}"] }'
    );

    const detector = new FrameworkDetector(testDir);
    const frameworks = await detector.detect();

    expect(frameworks).toContain('tailwind');

    fs.unlinkSync(path.join(testDir, 'tailwind.config.js'));
  });

  test('should detect styled-components from package.json', async () => {
    fs.writeFileSync(
      path.join(testDir, 'package.json'),
      JSON.stringify({ dependencies: { 'styled-components': '^6.0.0' } })
    );

    const detector = new FrameworkDetector(testDir);
    const frameworks = await detector.detect();

    expect(frameworks).toContain('styled-components');

    fs.unlinkSync(path.join(testDir, 'package.json'));
  });

  test('should detect SCSS from file extensions', async () => {
    fs.mkdirSync(path.join(testDir, 'src'), { recursive: true });
    fs.writeFileSync(path.join(testDir, 'src/styles.scss'), '$color: red;');

    const detector = new FrameworkDetector(testDir);
    const frameworks = await detector.detect();

    expect(frameworks).toContain('scss');

    fs.rmSync(path.join(testDir, 'src'), { recursive: true, force: true });
  });
});
