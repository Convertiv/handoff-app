export declare const prompt: (query: string) => Promise<unknown>;
/**
 * Hide the Prompt
 * @param {string} query
 * @returns
 */
export declare const maskPrompt: (query: string, showAnswer?: boolean) => Promise<string>;
