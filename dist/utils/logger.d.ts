export declare class Logger {
    private static debugMode;
    static init(options?: {
        debug?: boolean;
    }): void;
    private static getTimestamp;
    static log(message: string): void;
    static info(message: string): void;
    static success(message: string): void;
    static warn(message: string): void;
    static error(message: string, error?: any): void;
    static debug(message: string, data?: any): void;
}
