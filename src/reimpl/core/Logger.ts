/**
 * Simple logging utility with log levels
 */

export enum LogLevel { 
    DEBUG = 0, 
    INFO = 1, 
    WARN = 2, 
    ERROR = 3 
}

export class Logger {
    private static logLevel: LogLevel = LogLevel.INFO;
    
    public static setLogLevel(level: LogLevel): void {
        Logger.logLevel = level;
    }
    
    public static debug(...args: any[]): void {
        if (Logger.logLevel <= LogLevel.DEBUG) {
            Logger.logMessage('DEBUG', 'color: #888', ...args);
        }
    }
    
    public static info(...args: any[]): void {
        if (Logger.logLevel <= LogLevel.INFO) {
            Logger.logMessage('INFO', 'color: #4CAF50', ...args);
        }
    }
    
    public static warn(...args: any[]): void {
        if (Logger.logLevel <= LogLevel.WARN) {
            Logger.logMessage('WARN', 'color: #FF9800', ...args);
        }
    }
    
    public static error(...args: any[]): void {
        if (Logger.logLevel <= LogLevel.ERROR) {
            Logger.logMessage('ERROR', 'color: #F44336', ...args);
        }
    }

    private static logMessage(level: string, color: string, ...args: any[]): void {
        const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
        console.log(
            `%c[${timestamp}] [${level}]`,
            color,
            ...args
        );
    }
}
