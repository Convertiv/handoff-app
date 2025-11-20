module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    'setup.ts',
    'fixtures/',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/__tests__/**',
  ],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    }],
  },
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  testTimeout: 30000,
  // Ignore node_modules except for ESM packages that need transformation
  transformIgnorePatterns: [
    'node_modules/(?!(chalk|ora|inquirer)/)',
  ],
  // Mock environment variables for tests
  testEnvironmentOptions: {
    url: 'http://localhost',
    // Provide a temp file path for localStorage
    'localstorage-file': '.jest-localstorage',
  },
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
};
