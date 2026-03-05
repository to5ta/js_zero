/**
 * Environment detection and device information
 */

export class Environment {
    private static _isMobile: boolean;
    private static _canvas: HTMLCanvasElement;
    
    /**
     * Initialize environment detection
     */
    public static init(): void {
        // Detect mobile device
        this._isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent
        );
        
        // Create canvas
        this._canvas = document.createElement('canvas');
        this._canvas.style.width = '100%';
        this._canvas.style.height = '100%';
        this._canvas.style.display = 'block';
        this._canvas.style.position = 'absolute';
        this._canvas.style.top = '0';
        this._canvas.style.left = '0';
        document.body.appendChild(this._canvas);
        
        // Set actual canvas size to match display size
        this._canvas.width = window.innerWidth;
        this._canvas.height = window.innerHeight;
        
        // Remove body margins and padding
        document.body.style.margin = '0';
        document.body.style.padding = '0';
        document.body.style.overflow = 'hidden';
        
        // Prevent scrolling on mobile
        if (this._isMobile) {
            document.body.style.position = 'fixed';
            document.body.style.top = '0';
            document.body.style.left = '0';
            document.body.style.width = '100%';
            document.body.style.height = '100%';
            document.body.style.overflow = 'hidden';
            document.body.style.margin = '0';
            document.body.style.padding = '0';
        }
        
        console.log(`[Environment] Initialized - ${this._isMobile ? 'Mobile' : 'Desktop'} device detected`);
        console.log(`[Environment] Canvas: ${this._canvas.width}x${this._canvas.height}`);
    }
    
    /**
     * Check if running on mobile device
     */
    public static get isMobile(): boolean {
        return this._isMobile;
    }
    
    /**
     * Get the canvas element
     */
    public static get canvas(): HTMLCanvasElement {
        if (!this._canvas) {
            throw new Error('Environment not initialized. Call Environment.init() first.');
        }
        return this._canvas;
    }
    
    /**
     * Get viewport dimensions
     */
    public static get viewport() {
        return {
            width: window.innerWidth,
            height: window.innerHeight
        };
    }
}
