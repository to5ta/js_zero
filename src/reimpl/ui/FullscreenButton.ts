import { InputState } from '../systems/InputState';
import { Logger } from '../core/Logger';

/**
 * Fullscreen button UI - shown on all devices with keyboard shortcut (F key)
 */
export class FullscreenButton {
    private container?: HTMLDivElement;
    private button?: HTMLButtonElement;
    private inputState: InputState;
    private isFullscreen: boolean = false;
    
    constructor(inputState: InputState) {
        this.inputState = inputState;
        this.createUI();
        this.setupEventListeners();
        this.setupKeyboardShortcut();
        Logger.info('Fullscreen button created (F key to toggle)');
    }
    
    /**
     * Setup keyboard shortcut (F key) for fullscreen toggle
     */
    private setupKeyboardShortcut(): void {
        window.addEventListener('keydown', (e) => {
            // F key toggles fullscreen (not F11 to avoid browser default)
            if (e.key === 'f' || e.key === 'F') {
                e.preventDefault();
                console.log('[TRACE] F key pressed, toggling fullscreen');
                this.toggleFullscreen();
            }
        });
    }
    
    /**
     * Detect if device is mobile
     */
    private isMobileDevice(): boolean {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               (window.innerWidth <= 768); // Also check screen size
    }
    
    /**
     * Create the UI elements
     */
    private createUI(): void {
        // Create container
        this.container = document.createElement('div');
        this.container.style.position = 'fixed';
        this.container.style.top = '10px';
        this.container.style.right = '10px';
        this.container.style.zIndex = '10000';
        
        // Create button
        this.button = document.createElement('button');
        this.button.innerHTML = '⛶'; // Fullscreen icon
        this.button.style.width = '50px';
        this.button.style.height = '50px';
        this.button.style.fontSize = '24px';
        this.button.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.button.style.color = 'white';
        this.button.style.border = '2px solid rgba(255, 255, 255, 0.3)';
        this.button.style.borderRadius = '10px';
        this.button.style.cursor = 'pointer';
        this.button.style.display = 'flex';
        this.button.style.justifyContent = 'center';
        this.button.style.alignItems = 'center';
        this.button.style.transition = 'all 0.2s ease';
        this.button.style.touchAction = 'manipulation'; // Prevent double-tap zoom
        
        // Hover effect (for devices with hover support)
        this.button.addEventListener('mouseenter', () => {
            if (this.button) {
                this.button.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
                this.button.style.transform = 'scale(1.1)';
            }
        });
        
        this.button.addEventListener('mouseleave', () => {
            if (this.button) {
                this.button.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
                this.button.style.transform = 'scale(1)';
            }
        });
        
        // Click handler
        this.button.addEventListener('click', () => {
            console.log('[TRACE] Fullscreen button clicked!');
            this.toggleFullscreen();
        });
        
        // Assemble
        this.container.appendChild(this.button);
        document.body.appendChild(this.container);
    }
    
    /**
     * Setup event listeners for fullscreen changes
     */
    private setupEventListeners(): void {
        document.addEventListener('fullscreenchange', () => {
            console.log('[TRACE] fullscreenchange event fired');
            console.log('[TRACE] document.fullscreenElement:', document.fullscreenElement);
            
            this.isFullscreen = !!document.fullscreenElement;
            console.log('[TRACE] Updated isFullscreen to:', this.isFullscreen);
            
            this.updateButtonIcon();
        });
        
        document.addEventListener('fullscreenerror', (event) => {
            console.error('[ERROR] fullscreenerror event fired:', event);
            Logger.error('Fullscreen error event occurred');
        });
    }
    
    /**
     * Toggle fullscreen mode
     */
    private toggleFullscreen(): void {
        console.log('[TRACE] FullscreenButton.toggleFullscreen() called');
        console.log('[TRACE] Current isFullscreen state:', this.isFullscreen);
        console.log('[TRACE] document.fullscreenElement:', document.fullscreenElement);
        
        try {
            if (this.isFullscreen) {
                console.log('[TRACE] Exiting fullscreen...');
                this.inputState.exitFullscreen();
                Logger.info('Exiting fullscreen');
            } else {
                console.log('[TRACE] Entering fullscreen...');
                this.inputState.requestFullscreen();
                Logger.info('Entering fullscreen (click canvas to capture mouse)');
            }
        } catch (error) {
            console.error('[EXCEPTION] Exception in toggleFullscreen:', error);
            Logger.error('Failed to toggle fullscreen:', error);
        }
    }
    
    /**
     * Update button icon based on fullscreen state
     */
    private updateButtonIcon(): void {
        if (this.button) {
            // ⛶ for enter fullscreen, ⛉ for exit, or use unicode arrows
            this.button.innerHTML = this.isFullscreen ? '🗗' : '🗖'; // Exit fullscreen : Enter fullscreen
            this.button.title = this.isFullscreen ? 'Exit Fullscreen (F)' : 'Enter Fullscreen (F)';
        }
    }
    
    /**
     * Show the button
     */
    public show(): void {
        if (this.container) {
            this.container.style.display = 'block';
        }
    }
    
    /**
     * Hide the button
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
            Logger.info('Fullscreen button disposed');
        }
    }
}
