/**
 * Represents the state of a file for change detection
 */
export interface FileState {
    /** File modification time in milliseconds */
    mtime: number;
    /** File size in bytes */
    size: number;
}
/**
 * Computes the current state (mtime, size) of a file
 * @param filePath - Absolute path to the file
 * @returns FileState if file exists, null otherwise
 */
export declare function computeFileState(filePath: string): Promise<FileState | null>;
/**
 * Computes file states for all files in a directory (recursively)
 * @param dirPath - Absolute path to the directory
 * @param extensions - Optional array of file extensions to include (e.g., ['.hbs', '.html'])
 * @returns Record mapping relative file paths to their states
 */
export declare function computeDirectoryState(dirPath: string, extensions?: string[]): Promise<Record<string, FileState>>;
/**
 * Compares two file states for equality
 * @param a - First file state (can be null/undefined)
 * @param b - Second file state (can be null/undefined)
 * @returns true if states match, false otherwise
 */
export declare function statesMatch(a: FileState | null | undefined, b: FileState | null | undefined): boolean;
/**
 * Compares two records of file states
 * @param cached - Previously cached file states
 * @param current - Current file states
 * @returns true if all states match, false if any differ or files added/removed
 */
export declare function directoryStatesMatch(cached: Record<string, FileState> | null | undefined, current: Record<string, FileState> | null | undefined): boolean;
