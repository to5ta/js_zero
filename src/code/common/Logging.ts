enum LogLevel { 
    DEBUG = 0, 
    INFO = 1, 
    WARN = 2, 
    ERROR = 3 }

class Logging {
    private static logLevel: LogLevel = LogLevel.INFO;
    
    public static setLogLevel(level: LogLevel) {
        Logging.logLevel = level;
    }
    
    public static debug(...args: any[]) {
        if(Logging.logLevel >= 0) {
            Logging.logMessage("DEBUG :", ...args);
        }
    }
    
    public static info(...args: any[]) {
        if(Logging.logLevel >= 1) {
            Logging.logMessage("INFO  :", ...args);
        }
    }
    
    public static warn(...args: any[]) {
        if(Logging.logLevel >= 2) {
            Logging.logMessage("WARN  :", ...args);
        }
    }
    
    public static error(...args: any[]) {
        if(Logging.logLevel >= 3) {
            Logging.logMessage("ERROR ", ...args);
        }
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

export { Logging, LogLevel };