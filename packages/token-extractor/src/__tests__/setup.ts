/**
 * Jest setup file
 * Runs before all tests to set up the test environment
 */

// Add fetch polyfill for Anthropic SDK
import 'whatwg-fetch';

// Add setImmediate polyfill for jsdom environment (needed by fast-glob)
if (typeof global.setImmediate === 'undefined') {
  global.setImmediate = ((fn: any, ...args: any[]) => {
    return setTimeout(fn, 0, ...args);
  }) as any;
}

if (typeof global.clearImmediate === 'undefined') {
  global.clearImmediate = ((id: any) => {
    return clearTimeout(id);
  }) as any;
}

// Mock localStorage for AI SDK dependencies
class LocalStorageMock {
  private store: Record<string, string> = {};

  clear() {
    this.store = {};
  }

  getItem(key: string) {
    return this.store[key] || null;
  }

  setItem(key: string, value: string) {
    this.store[key] = String(value);
  }

  removeItem(key: string) {
    delete this.store[key];
  }

  get length() {
    return Object.keys(this.store).length;
  }

  key(index: number) {
    const keys = Object.keys(this.store);
    return keys[index] || null;
  }
}

// Assign to global
global.localStorage = new LocalStorageMock() as any;

// Mock console methods to reduce noise in test output
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Set default environment variables for tests
process.env.NODE_ENV = 'test';

// Suppress specific warnings from dependencies
const originalWarn = console.warn;
beforeAll(() => {
  console.warn = (...args: any[]) => {
    const msg = args[0];
    // Suppress specific known warnings
    if (
      typeof msg === 'string' &&
      (msg.includes('ExperimentalWarning') || 
       msg.includes('punycode'))
    ) {
      return;
    }
    originalWarn(...args);
  };
});

afterAll(() => {
  console.warn = originalWarn;
});
