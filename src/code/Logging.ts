interface LoggingLevel {}
abstract class DEBUG implements LoggingLevel {}
abstract class INFO implements LoggingLevel {}
abstract class WARN implements LoggingLevel {}
abstract class ERROR implements LoggingLevel {}

class Logging {
    private static logLevel: LoggingLevel = DEBUG;
    
    public static setLogLevel(level: LoggingLevel) {
        Logging.logLevel = level;
    }
    
    public static debug(...args: any[]) {
        if(Logging.logLevel == DEBUG) {
            Logging.logMessage("DEBUG :", ...args);
        }
    }
    
    public static info(...args: any[]) {
        if(Logging.logLevel == INFO ||
            Logging.logLevel == DEBUG ) {
            Logging.logMessage("INFO  :", ...args);
        }
    }
    
    public static warn(...args: any[]) {
        if(Logging.logLevel == INFO ||
            Logging.logLevel == DEBUG ||
            Logging.logLevel == WARN ) {
            Logging.logMessage("WARN  :", ...args);
        }
    }
    
    public static error(...args: any[]) {
        Logging.logMessage("ERROR ", ...args);
    }

    private static logMessage(...args: any[]) {
        let concat_args = new Array<any>();
        args.forEach(arg => {
            if(typeof arg === "string" && concat_args.length && typeof concat_args.at(-1) === "string") {
                concat_args[concat_args.length-1] = `${concat_args[concat_args.length-1]} ${arg}`
            } else
                concat_args.push(arg);
        });

        console.log(...concat_args);
    }
}

export { Logging, DEBUG, WARN, INFO, ERROR };