import { Logger } from '../core/Logger';
import { TraceDisplay } from './TraceDisplay';

interface ErrorEntry {
    message: string;
    stack?: string;
    timestamp: Date;
}

/**
 * Error display UI - shows runtime errors in a dismissible overlay
 */
export class ErrorDisplay {
    private container?: HTMLDivElement;
    private errorText?: HTMLDivElement;
    private errorStack?: HTMLPreElement;
    private closeButton?: HTMLButtonElement;
    private errorHistory: ErrorEntry[] = [];
    private errorLogButton?: HTMLButtonElement;
    private errorLogPanel?: HTMLDivElement;
    private isLogVisible: boolean = false;
    private traceDisplay?: TraceDisplay;
    
    constructor(traceDisplay?: TraceDisplay) {
        this.traceDisplay = traceDisplay;
        this.setupGlobalErrorHandler();
        this.createErrorLogButton();
        Logger.info('Error display initialized with global error handler');
    }
    
    /**
     * Setup global error handler to catch all errors
     */
    private setupGlobalErrorHandler(): void {
        // Catch unhandled errors
        window.addEventListener('error', (event) => {
            const error = {
                message: event.error?.message || event.message || 'Unknown error',
                stack: event.error?.stack || event.filename + ':' + event.lineno,
                timestamp: new Date()
            };
            this.errorHistory.push(error);
            this.updateErrorLogButton();
            this.showError(error.message, error.stack);
        });
        
        // Catch unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            // Log the full event to console for debugging
            console.error('Unhandled Promise Rejection Event:', event);
            console.error('Reason:', event.reason);
            
            let errorMessage = 'Unhandled Promise Rejection';
            let errorStack = '';
            
            // Try to extract meaningful error information
            if (event.reason) {
                if (event.reason instanceof Error) {
                    errorMessage = 'Promise Rejection: ' + event.reason.message;
                    errorStack = event.reason.stack || '';
                } else if (typeof event.reason === 'string') {
                    errorMessage = 'Promise Rejection: ' + event.reason;
                } else if (typeof event.reason === 'object') {
                    try {
                        errorMessage = 'Promise Rejection: ' + JSON.stringify(event.reason, null, 2);
                    } catch (e) {
                        errorMessage = 'Promise Rejection: ' + String(event.reason);
                    }
                } else {
                    errorMessage = 'Promise Rejection: ' + String(event.reason);
                }
            }
            
            const error = {
                message: errorMessage,
                stack: errorStack,
                timestamp: new Date()
            };
            this.errorHistory.push(error);
            this.updateErrorLogButton();
            this.showError(error.message, error.stack);
        });
    }
    
    /**
     * Create persistent error log button (bottom-right corner)
     */
    private createErrorLogButton(): void {
        this.errorLogButton = document.createElement('button');
        this.errorLogButton.innerHTML = '🐛 <span id="error-count">0</span>';
        this.errorLogButton.style.position = 'fixed';
        this.errorLogButton.style.bottom = '10px';
        this.errorLogButton.style.right = '10px';
        this.errorLogButton.style.backgroundColor = 'rgba(200, 0, 0, 0.9)';
        this.errorLogButton.style.color = 'white';
        this.errorLogButton.style.border = '2px solid rgba(255, 255, 255, 0.5)';
        this.errorLogButton.style.borderRadius = '25px';
        this.errorLogButton.style.padding = '10px 15px';
        this.errorLogButton.style.fontSize = '16px';
        this.errorLogButton.style.cursor = 'pointer';
        this.errorLogButton.style.zIndex = '99999';
        this.errorLogButton.style.fontFamily = 'monospace';
        this.errorLogButton.style.fontWeight = 'bold';
        this.errorLogButton.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.5)';
        this.errorLogButton.style.display = 'none'; // Hidden until first error
        this.errorLogButton.style.touchAction = 'manipulation';
        
        this.errorLogButton.addEventListener('click', () => {
            this.toggleErrorLog();
        });
        
        document.body.appendChild(this.errorLogButton);
    }
    
    /**
     * Update error log button count
     */
    private updateErrorLogButton(): void {
        if (this.errorLogButton) {
            const countSpan = this.errorLogButton.querySelector('#error-count');
            if (countSpan) {
                countSpan.textContent = String(this.errorHistory.length);
            }
            this.errorLogButton.style.display = 'block';
            
            // Show trace display when first error occurs
            if (this.errorHistory.length === 1 && this.traceDisplay) {
                this.traceDisplay.show();
                Logger.info('Trace display shown due to error');
            }
        }
    }
    
    /**
     * Toggle error log panel
     */
    private toggleErrorLog(): void {
        if (this.isLogVisible) {
            this.hideErrorLog();
        } else {
            this.showErrorLog();
        }
    }
    
    /**
     * Show error log panel
     */
    private showErrorLog(): void {
        this.isLogVisible = true;
        
        // Create panel
        this.errorLogPanel = document.createElement('div');
        this.errorLogPanel.style.position = 'fixed';
        this.errorLogPanel.style.bottom = '70px';
        this.errorLogPanel.style.right = '10px';
        this.errorLogPanel.style.width = 'min(500px, 90vw)';
        this.errorLogPanel.style.maxHeight = '60vh';
        this.errorLogPanel.style.backgroundColor = 'rgba(40, 40, 40, 0.98)';
        this.errorLogPanel.style.color = 'white';
        this.errorLogPanel.style.border = '2px solid rgba(200, 0, 0, 0.8)';
        this.errorLogPanel.style.borderRadius = '10px';
        this.errorLogPanel.style.padding = '15px';
        this.errorLogPanel.style.zIndex = '99998';
        this.errorLogPanel.style.overflow = 'auto';
        this.errorLogPanel.style.fontFamily = 'monospace';
        this.errorLogPanel.style.fontSize = '12px';
        this.errorLogPanel.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.7)';
        
        // Header
        const header = document.createElement('div');
        header.style.borderBottom = '2px solid rgba(200, 0, 0, 0.5)';
        header.style.paddingBottom = '10px';
        header.style.marginBottom = '10px';
        header.style.fontSize = '14px';
        header.style.fontWeight = 'bold';
        header.innerHTML = '🐛 Error Log (' + this.errorHistory.length + ' errors)';
        
        // Clear button
        const clearButton = document.createElement('button');
        clearButton.textContent = 'Clear';
        clearButton.style.float = 'right';
        clearButton.style.backgroundColor = 'rgba(200, 0, 0, 0.5)';
        clearButton.style.color = 'white';
        clearButton.style.border = '1px solid white';
        clearButton.style.borderRadius = '5px';
        clearButton.style.padding = '5px 10px';
        clearButton.style.cursor = 'pointer';
        clearButton.style.fontSize = '12px';
        clearButton.addEventListener('click', () => {
            this.clearErrorHistory();
        });
        header.appendChild(clearButton);
        
        this.errorLogPanel.appendChild(header);
        
        // Error entries (most recent first)
        const reversed = [...this.errorHistory].reverse();
        reversed.forEach((error, index) => {
            const entry = document.createElement('div');
            entry.style.marginBottom = '15px';
            entry.style.padding = '10px';
            entry.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
            entry.style.borderRadius = '5px';
            entry.style.borderLeft = '3px solid rgba(200, 0, 0, 0.8)';
            
            const time = document.createElement('div');
            time.textContent = error.timestamp.toLocaleTimeString();
            time.style.fontSize = '10px';
            time.style.opacity = '0.7';
            time.style.marginBottom = '5px';
            
            const message = document.createElement('div');
            message.textContent = error.message;
            message.style.fontWeight = 'bold';
            message.style.marginBottom = '5px';
            message.style.wordWrap = 'break-word';
            
            entry.appendChild(time);
            entry.appendChild(message);
            
            if (error.stack) {
                const stackPre = document.createElement('pre');
                stackPre.textContent = error.stack;
                stackPre.style.fontSize = '10px';
                stackPre.style.opacity = '0.8';
                stackPre.style.marginTop = '5px';
                stackPre.style.whiteSpace = 'pre-wrap';
                stackPre.style.wordWrap = 'break-word';
                stackPre.style.maxHeight = '100px';
                stackPre.style.overflow = 'auto';
                entry.appendChild(stackPre);
            }
            
            this.errorLogPanel!.appendChild(entry);
        });
        
        // No errors message
        if (this.errorHistory.length === 0) {
            const noErrors = document.createElement('div');
            noErrors.textContent = 'No errors recorded';
            noErrors.style.textAlign = 'center';
            noErrors.style.opacity = '0.5';
            noErrors.style.padding = '20px';
            this.errorLogPanel.appendChild(noErrors);
        }
        
        document.body.appendChild(this.errorLogPanel);
    }
    
    /**
     * Hide error log panel
     */
    private hideErrorLog(): void {
        this.isLogVisible = false;
        if (this.errorLogPanel && this.errorLogPanel.parentElement) {
            this.errorLogPanel.parentElement.removeChild(this.errorLogPanel);
            this.errorLogPanel = undefined;
        }
    }
    
    /**
     * Clear error history
     */
    private clearErrorHistory(): void {
        this.errorHistory = [];
        this.updateErrorLogButton();
        if (this.errorLogButton) {
            this.errorLogButton.style.display = 'none';
        }
        if (this.traceDisplay) {
            this.traceDisplay.hide();
            this.traceDisplay.clear();
        }
        this.hideErrorLog();
    }
    
    /**
     * Show an error in the UI
     */
    public showError(message: string, stack?: string): void {
        Logger.error('Displaying error:', message);
        
        // Remove existing error display if any
        this.hide();
        
        // Create container
        this.container = document.createElement('div');
        this.container.style.position = 'fixed';
        this.container.style.top = '50%';
        this.container.style.left = '50%';
        this.container.style.transform = 'translate(-50%, -50%)';
        this.container.style.backgroundColor = 'rgba(200, 0, 0, 0.95)';
        this.container.style.color = 'white';
        this.container.style.padding = '20px';
        this.container.style.borderRadius = '10px';
        this.container.style.zIndex = '999999';
        this.container.style.maxWidth = '80%';
        this.container.style.maxHeight = '80%';
        this.container.style.overflow = 'auto';
        this.container.style.fontFamily = 'monospace';
        this.container.style.border = '3px solid rgba(255, 255, 255, 0.5)';
        this.container.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.5)';
        
        // Create header with close button
        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.marginBottom = '15px';
        header.style.borderBottom = '2px solid rgba(255, 255, 255, 0.3)';
        header.style.paddingBottom = '10px';
        
        const title = document.createElement('h3');
        title.textContent = '⚠️ Runtime Error';
        title.style.margin = '0';
        title.style.fontSize = '20px';
        
        // Create close button
        this.closeButton = document.createElement('button');
        this.closeButton.textContent = '✕';
        this.closeButton.style.background = 'transparent';
        this.closeButton.style.border = '2px solid white';
        this.closeButton.style.color = 'white';
        this.closeButton.style.fontSize = '20px';
        this.closeButton.style.width = '30px';
        this.closeButton.style.height = '30px';
        this.closeButton.style.cursor = 'pointer';
        this.closeButton.style.borderRadius = '5px';
        this.closeButton.style.display = 'flex';
        this.closeButton.style.alignItems = 'center';
        this.closeButton.style.justifyContent = 'center';
        
        this.closeButton.addEventListener('click', () => this.hide());
        this.closeButton.addEventListener('mouseenter', () => {
            if (this.closeButton) {
                this.closeButton.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
            }
        });
        this.closeButton.addEventListener('mouseleave', () => {
            if (this.closeButton) {
                this.closeButton.style.backgroundColor = 'transparent';
            }
        });
        
        header.appendChild(title);
        header.appendChild(this.closeButton);
        
        // Create error message
        this.errorText = document.createElement('div');
        this.errorText.textContent = message;
        this.errorText.style.fontSize = '16px';
        this.errorText.style.marginBottom = '15px';
        this.errorText.style.wordWrap = 'break-word';
        this.errorText.style.fontWeight = 'bold';
        
        // Create stack trace
        if (stack) {
            const stackLabel = document.createElement('div');
            stackLabel.textContent = 'Stack Trace:';
            stackLabel.style.fontSize = '14px';
            stackLabel.style.marginBottom = '5px';
            stackLabel.style.fontWeight = 'bold';
            
            this.errorStack = document.createElement('pre');
            this.errorStack.textContent = stack;
            this.errorStack.style.fontSize = '12px';
            this.errorStack.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
            this.errorStack.style.padding = '10px';
            this.errorStack.style.borderRadius = '5px';
            this.errorStack.style.overflow = 'auto';
            this.errorStack.style.maxHeight = '300px';
            this.errorStack.style.whiteSpace = 'pre-wrap';
            this.errorStack.style.wordWrap = 'break-word';
            
            this.container.appendChild(header);
            this.container.appendChild(this.errorText);
            this.container.appendChild(stackLabel);
            this.container.appendChild(this.errorStack);
        } else {
            this.container.appendChild(header);
            this.container.appendChild(this.errorText);
        }
        
        // Add instruction
        const instruction = document.createElement('div');
        instruction.textContent = 'Check browser console for more details';
        instruction.style.fontSize = '12px';
        instruction.style.marginTop = '15px';
        instruction.style.fontStyle = 'italic';
        instruction.style.opacity = '0.8';
        this.container.appendChild(instruction);
        
        document.body.appendChild(this.container);
    }
    
    /**
     * Hide the error display
     */
    public hide(): void {
        if (this.container && this.container.parentElement) {
            this.container.parentElement.removeChild(this.container);
            this.container = undefined;
        }
    }
    
    /**
     * Dispose and cleanup
     */
    public dispose(): void {
        this.hide();
        this.hideErrorLog();
        if (this.errorLogButton && this.errorLogButton.parentElement) {
            this.errorLogButton.parentElement.removeChild(this.errorLogButton);
        }
        Logger.info('Error display disposed');
    }
}
