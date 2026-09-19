/** Raised when an explicitly requested config file cannot be used. */
export class HandoffConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HandoffConfigError';
  }
}
