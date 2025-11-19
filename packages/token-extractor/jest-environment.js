const NodeEnvironment = require('jest-environment-node').default;

/**
 * Custom Jest environment that provides localStorage
 * This is needed because AI SDK dependencies try to access localStorage
 */
class CustomEnvironment extends NodeEnvironment {
  constructor(config, context) {
    super(config, context);
  }

  async setup() {
    await super.setup();
    
    // Mock localStorage before any tests run
    class LocalStorageMock {
      constructor() {
        this.store = {};
      }

      clear() {
        this.store = {};
      }

      getItem(key) {
        return this.store[key] || null;
      }

      setItem(key, value) {
        this.store[key] = String(value);
      }

      removeItem(key) {
        delete this.store[key];
      }

      get length() {
        return Object.keys(this.store).length;
      }

      key(index) {
        const keys = Object.keys(this.store);
        return keys[index] || null;
      }
    }

    this.global.localStorage = new LocalStorageMock();
    
    // Also provide sessionStorage
    this.global.sessionStorage = new LocalStorageMock();
    
    // Set test environment variable
    this.global.process.env.NODE_ENV = 'test';
  }

  async teardown() {
    await super.teardown();
  }
}

module.exports = CustomEnvironment;
