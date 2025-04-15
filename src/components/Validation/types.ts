export interface ValidationResult {
  /**
   * Description of what this validation check does
   */
  description: string;
  /**
   * Whether the validation passed or failed
   */
  passed: boolean;
  /**
   * Optional messages providing more details about the validation result
   */
  messages?: string[];
  /**
   * Optional severity level of the validation result
   */
  severity?: 'error' | 'warning' | 'info';
  /**
   * Optional timestamp of when the validation was performed
   */
  timestamp?: string;
}

export interface ValidationResults {
  [key: string]: ValidationResult;
}
