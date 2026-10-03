import { Logger } from '../core/Logger';

/**
 * Trace display - shows console logs on screen for mobile debugging
 */
export class TraceDisplay {
    private container?: HTMLDivElement;
    private logContainer?: HTMLDivElement;
    private logs: string[] = [];
    private maxLogs: number = 50;
    
    constructor() {
        this.createUI();
        this.interceptConsole();
        Logger.info('Trace display initialized');
    }
    
    /**
     * Create the UI
     */
    private createUI(): void {
        // Create container
        this.container = document.createElement('div');
        this.container.style.position = 'fixed';
        this.container.style.top = '10px';
        this.container.style.left = '10px';
        this.container.style.width = '350px';
        this.container.style.maxHeight = '300px';
        this.container.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
        this.container.style.color = '#00ff00';
        this.container.style.border = '2px solid rgba(0, 255, 0, 0.5)';
        this.container.style.borderRadius = '5px';
        this.container.style.padding = '10px';
        this.container.style.zIndex = '999999';
        this.container.style.fontFamily = 'monospace';
        this.container.style.fontSize = '10px';
        this.container.style.overflow = 'auto';
        this.container.style.pointerEvents = 'none'; // Don't block clicks
        this.container.style.display = 'none'; // Start hidden
        
        // Header
        const header = document.createElement('div');
        header.textContent = '📊 TRACE LOG';
        header.style.fontWeight = 'bold';
        header.style.marginBottom = '5px';
        header.style.color = '#00ff00';
        header.style.borderBottom = '1px solid rgba(0, 255, 0, 0.3)';
        header.style.paddingBottom = '5px';
        
        // Log container
        this.logContainer = document.createElement('div');
        
        this.container.appendChild(header);
        this.container.appendChild(this.logContainer);
        
        document.body.appendChild(this.container);
    }
    
    /**
     * Intercept console methods to display logs
     */
    private interceptConsole(): void {
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;
        
        console.log = (...args: any[]) => {
            originalLog.apply(console, args);
            const message = args.map(arg => this.formatArg(arg)).join(' ');
            if (message.includes('[TRACE]') || message.includes('[SUCCESS]')) {
                this.addLog('LOG', message);
            }
        };
        
        console.error = (...args: any[]) => {
            originalError.apply(console, args);
            const message = args.map(arg => this.formatArg(arg)).join(' ');
            if (message.includes('[TRACE]') || message.includes('[ERROR]') || message.includes('[EXCEPTION]')) {
                this.addLog('ERROR', message);
            }
        };
        
        console.warn = (...args: any[]) => {
            originalWarn.apply(console, args);
            const message = args.map(arg => this.formatArg(arg)).join(' ');
            if (message.includes('[TRACE]') || message.includes('[WARN]')) {
                this.addLog('WARN', message);
            }
        };
    }
    
    /**
     * Format an argument for display
     */
    private formatArg(arg: any): string {
        if (arg === null) return 'null';
        if (arg === undefined) return 'undefined';
        if (typeof arg === 'string') return arg;
        if (typeof arg === 'number' || typeof arg === 'boolean') return String(arg);
        if (arg instanceof Error) return arg.message;
        try {
            return JSON.stringify(arg);
        } catch (e) {
            return String(arg);
        }
    }
    
    /**
     * Add a log entry
     */
    private addLog(type: 'LOG' | 'ERROR' | 'WARN', message: string): void {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = `[${timestamp}] ${message}`;
        
        this.logs.push(logEntry);
        
        // Keep only last N logs
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }
        
        this.updateDisplay(type, logEntry);
    }
    
    /**
     * Update the display
     */
    private updateDisplay(type: 'LOG' | 'ERROR' | 'WARN', newEntry: string): void {
        if (!this.logContainer) return;
        
        const entry = document.createElement('div');
        entry.textContent = newEntry;
        entry.style.marginBottom = '2px';
        entry.style.paddingLeft = '5px';
        entry.style.wordWrap = 'break-word';
        
        if (type === 'ERROR') {
            entry.style.color = '#ff4444';
            entry.style.fontWeight = 'bold';
        } else if (type === 'WARN') {
            entry.style.color = '#ffaa00';
        } else {
            entry.style.color = '#00ff00';
        }
        
        this.logContainer.appendChild(entry);
        
        // Auto-scroll to bottom
        this.container!.scrollTop = this.container!.scrollHeight;
        
        // Keep only visible entries
        while (this.logContainer.children.length > this.maxLogs) {
            this.logContainer.removeChild(this.logContainer.firstChild!);
        }
    }
    
    /**
     * Clear all logs
     */
    public clear(): void {
        this.logs = [];
        if (this.logContainer) {
            this.logContainer.innerHTML = '';
        }
    }
    
    /**
     * Show the display
     */
    public show(): void {
        if (this.container) {
            this.container.style.display = 'block';
        }
    }
    
    /**
     * Hide the display
     */
    public hide(): void {
        if (this.container) {
            this.container.style.display = 'none';
        }
    }
    
    /**
     * Dispose and cleanup
     */
    public dispose(): void {
        if (this.container && this.container.parentElement) {
            this.container.parentElement.removeChild(this.container);
        }
        Logger.info('Trace display disposed');
    }
}
