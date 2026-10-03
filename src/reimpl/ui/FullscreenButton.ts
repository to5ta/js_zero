import { InputState } from '../systems/InputState';
import { Logger } from '../core/Logger';
import { applyIronSurface, icon, Theme } from './theme';

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
                this.toggleFullscreen();
            }
        });
    }

    /**
     * Create the UI elements
     */
    private createUI(): void {
        this.container = document.createElement('div');
        this.container.style.position = 'fixed';
        this.container.style.top = 'calc(10px + env(safe-area-inset-top, 0px))';
        this.container.style.right = 'calc(10px + env(safe-area-inset-right, 0px))';
        this.container.style.zIndex = '10000';

        this.button = document.createElement('button');
        this.button.innerHTML = icon('fullscreen', 18);
        this.button.setAttribute('aria-label', 'Toggle fullscreen');
        this.button.style.width = '40px';
        this.button.style.height = '40px';
        this.button.style.padding = '0';
        this.button.style.cursor = 'pointer';
        this.button.style.display = 'flex';
        this.button.style.justifyContent = 'center';
        this.button.style.alignItems = 'center';
        this.button.style.transition = 'background 120ms linear, color 120ms linear';
        this.button.style.touchAction = 'manipulation'; // Prevent double-tap zoom
        applyIronSurface(this.button, '10px');

        this.button.addEventListener('mouseenter', () => {
            if (this.button) this.button.style.color = Theme.brassBright;
        });

        this.button.addEventListener('mouseleave', () => {
            if (this.button) this.button.style.color = Theme.text;
        });

        this.button.addEventListener('click', () => {
            this.toggleFullscreen();
        });

        this.container.appendChild(this.button);
        document.body.appendChild(this.container);
    }

    /**
     * Setup event listeners for fullscreen changes
     */
    private setupEventListeners(): void {
        document.addEventListener('fullscreenchange', () => {
            this.isFullscreen = !!document.fullscreenElement;
            this.updateButtonIcon();
        });

        document.addEventListener('fullscreenerror', () => {
            Logger.error('Fullscreen error event occurred');
        });
    }

    /**
     * Toggle fullscreen mode
     */
    private toggleFullscreen(): void {
        try {
            if (this.isFullscreen) {
                this.inputState.exitFullscreen();
                Logger.info('Exiting fullscreen');
            } else {
                this.inputState.requestFullscreen();
                Logger.info('Entering fullscreen (click canvas to capture mouse)');
            }
        } catch (error) {
            Logger.error('Failed to toggle fullscreen:', error);
        }
    }

    /**
     * Update button icon based on fullscreen state
     */
    private updateButtonIcon(): void {
        if (this.button) {
            this.button.innerHTML = icon(this.isFullscreen ? 'fullscreenExit' : 'fullscreen', 18);
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
