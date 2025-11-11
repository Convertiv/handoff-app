module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts'],
  testPathIgnorePatterns: ['/node_modules/', '/__tests__/fixtures/'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/__tests__/**',
  ],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  transformIgnorePatterns: [
    'node_modules/(?!(chalk|ora|inquirer|cli-spinners|cli-cursor|log-symbols|strip-ansi|ansi-regex|is-unicode-supported|#ansi-styles|wrap-ansi|ansi-styles|string-width|emoji-regex|figures|is-interactive|restore-cursor|onetime|mimic-fn|signal-exit|wcwidth|defaults|clone|mute-stream|run-async|rxjs|@inquirer)/)',
  ],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^#ansi-styles$': 'ansi-styles',
    '^#supports-color$': 'supports-color',
  },
};
