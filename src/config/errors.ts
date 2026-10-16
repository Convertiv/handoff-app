/** Raised when configuration cannot be loaded or resolved. */
export class HandoffConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HandoffConfigError';
  }
}
