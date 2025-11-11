import { Command } from 'commander';

// Mock the extract command before importing CLI
jest.mock('./commands/extract', () => ({
  extractCommand: jest.fn()
}));

import { createCLI } from './cli';

describe('CLI', () => {
  test('should create CLI program with correct name', () => {
    const program = createCLI();
    expect(program.name()).toBe('token-extractor');
  });

  test('should have extract command', () => {
    const program = createCLI();
    const commands = program.commands.map((cmd: Command) => cmd.name());
    expect(commands).toContain('extract');
  });

  test('should have version option', () => {
    const program = createCLI();
    expect(program.version()).toBeDefined();
  });
});
