/**
 * Environment detection and device information
 */

interface SimulatedViewportConfig {
    enabled: boolean;
    width: number;
    height: number;
    label: string;
}

export class Environment {
    private static _isMobile: boolean;
    private static _isPhysicalMobile: boolean;
    private static _canvas: HTMLCanvasElement;
    private static _rootHost: HTMLDivElement;
    private static _canvasHost: HTMLDivElement;
    private static _simulatedViewport?: SimulatedViewportConfig;
    
    /**
     * Initialize environment detection
     */
    public static init(): void {
        // Detect mobile device
        this._isPhysicalMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent
        );
        this._simulatedViewport = this.readSimulatedViewportConfig();
        this._isMobile = this._isPhysicalMobile || !!this._simulatedViewport?.enabled;

        // Create root host
        this._rootHost = document.createElement('div');
        this._rootHost.style.position = 'fixed';
        this._rootHost.style.inset = '0';
        this._rootHost.style.display = 'flex';
        this._rootHost.style.alignItems = 'center';
        this._rootHost.style.justifyContent = 'center';
        this._rootHost.style.overflow = 'hidden';
        this._rootHost.style.background = this._simulatedViewport?.enabled
            ? 'radial-gradient(circle at top, #202632 0%, #0f131b 62%, #090c12 100%)'
            : 'transparent';
        document.body.appendChild(this._rootHost);

        // Create canvas host/frame
        this._canvasHost = document.createElement('div');
        this._canvasHost.style.position = 'relative';
        this._canvasHost.style.overflow = 'hidden';
        this._rootHost.appendChild(this._canvasHost);
        
        // Create canvas
        this._canvas = document.createElement('canvas');
        this._canvas.style.width = '100%';
        this._canvas.style.height = '100%';
        this._canvas.style.display = 'block';
        this._canvas.style.position = 'relative';
        this._canvas.style.touchAction = 'none';
        this._canvasHost.appendChild(this._canvas);
        
        // Remove body margins and padding
        document.body.style.margin = '0';
        document.body.style.padding = '0';
        document.body.style.overflow = 'hidden';
        document.body.style.background = '#090c12';
        
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

        this.applyCanvasLayout();
        window.addEventListener('resize', this.handleResize);
        
        const modeLabel = this._simulatedViewport?.enabled
            ? `Desktop Mobile Test (${this._simulatedViewport.label})`
            : (this._isMobile ? 'Mobile' : 'Desktop');
        console.log(`[Environment] Initialized - ${modeLabel}`);
        console.log(`[Environment] Canvas: ${this._canvas.width}x${this._canvas.height}`);
    }

    private static readSimulatedViewportConfig(): SimulatedViewportConfig | undefined {
        const params = new URLSearchParams(window.location.search);
        const enabled = params.get('mobileTest') === '1' || localStorage.getItem('jszero.mobileTest') === '1';

        if (!enabled) {
            return undefined;
        }

        const width = this.parsePositiveInt(
            params.get('mobileWidth') ?? localStorage.getItem('jszero.mobileWidth'),
            430
        );
        const height = this.parsePositiveInt(
            params.get('mobileHeight') ?? localStorage.getItem('jszero.mobileHeight'),
            932
        );
        const label = params.get('mobileLabel') ?? localStorage.getItem('jszero.mobileLabel') ?? `${width}×${height}`;

        return {
            enabled: true,
            width,
            height,
            label
        };
    }

    private static parsePositiveInt(value: string | null, fallback: number): number {
        const parsed = Number.parseInt(value ?? '', 10);
        if (!Number.isFinite(parsed) || parsed <= 0) {
            return fallback;
        }

        return parsed;
    }

    private static handleResize = (): void => {
        this.applyCanvasLayout();
    };

    private static applyCanvasLayout(): void {
        if (!this._canvas || !this._canvasHost || !this._rootHost) {
            return;
        }

        const viewport = this.viewport;
        this._canvas.width = viewport.width;
        this._canvas.height = viewport.height;

        if (this._simulatedViewport?.enabled) {
            const availableWidth = Math.max(window.innerWidth - 48, 320);
            const availableHeight = Math.max(window.innerHeight - 48, 320);
            const scale = Math.min(
                availableWidth / viewport.width,
                availableHeight / viewport.height,
                1
            );

            this._canvasHost.style.width = `${viewport.width}px`;
            this._canvasHost.style.height = `${viewport.height}px`;
            this._canvasHost.style.maxWidth = 'none';
            this._canvasHost.style.maxHeight = 'none';
            this._rootHost.style.background = 'radial-gradient(circle at top, #202632 0%, #0f131b 62%, #090c12 100%)';
            this._canvasHost.style.borderRadius = '32px';
            this._canvasHost.style.border = '10px solid rgba(255, 255, 255, 0.08)';
            this._canvasHost.style.boxShadow = '0 32px 90px rgba(0, 0, 0, 0.45)';
            this._canvasHost.style.transform = `scale(${scale})`;
            this._canvasHost.style.transformOrigin = 'center center';
        } else {
            this._canvasHost.style.width = '100%';
            this._canvasHost.style.height = '100%';
            this._canvasHost.style.maxWidth = '100%';
            this._canvasHost.style.maxHeight = '100%';
            this._rootHost.style.background = 'transparent';
            this._canvasHost.style.borderRadius = '0';
            this._canvasHost.style.border = '0';
            this._canvasHost.style.boxShadow = 'none';
            this._canvasHost.style.transform = 'none';
        }
    }
    
    /**
     * Check if running on mobile device
     */
    public static get isMobile(): boolean {
        return this._isMobile;
    }

    /**
     * Check if this is a real mobile device without desktop emulation
     */
    public static get isPhysicalMobile(): boolean {
        return this._isPhysicalMobile;
    }

    /**
     * Check if mobile mode is being emulated on desktop
     */
    public static get isMobileEmulated(): boolean {
        return !!this._simulatedViewport?.enabled;
    }

    /**
     * Get current simulated viewport settings if active
     */
    public static get simulatedViewport(): SimulatedViewportConfig | undefined {
        return this._simulatedViewport;
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
        if (this._simulatedViewport?.enabled) {
            return {
                width: this._simulatedViewport.width,
                height: this._simulatedViewport.height
            };
        }

        return {
            width: window.innerWidth,
            height: window.innerHeight
        };
    }
}
