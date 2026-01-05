import { Logger } from '../core/Logger';

/**
 * Debug toggle button UI - turns debug visuals/overlays on or off.
 */
export class DebugToggleButton {
    private container?: HTMLDivElement;
    private button?: HTMLButtonElement;
    private debugEnabled: boolean;
    private onToggle: (enabled: boolean) => void;

    constructor(onToggle: (enabled: boolean) => void, initialEnabled: boolean = true) {
        this.onToggle = onToggle;
        this.debugEnabled = initialEnabled;
        this.createUI();
        this.updateButtonState();
        Logger.info('Debug toggle button created');
    }

    /**
     * Create the UI elements and wire click handler
     */
    private createUI(): void {
        this.container = document.createElement('div');
        this.container.style.position = 'fixed';
        this.container.style.top = '70px'; // Place under fullscreen button
        this.container.style.right = '10px';
        this.container.style.zIndex = '10000';

        this.button = document.createElement('button');
        this.button.innerHTML = '🐞';
        this.button.title = 'Toggle Debug';
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
        this.button.style.touchAction = 'manipulation';

        this.button.addEventListener('mouseenter', () => {
            if (this.button) {
                this.button.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
                this.button.style.transform = 'scale(1.05)';
            }
        });

        this.button.addEventListener('mouseleave', () => {
            if (this.button) {
                this.button.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
                this.button.style.transform = 'scale(1)';
            }
        });

        this.button.addEventListener('click', () => {
            this.debugEnabled = !this.debugEnabled;
            this.updateButtonState();
            this.onToggle(this.debugEnabled);
        });

        this.container.appendChild(this.button);
        document.body.appendChild(this.container);
    }

    /**
     * Update label/icon to reflect current state
     */
    private updateButtonState(): void {
        if (!this.button) return;
        this.button.innerHTML = this.debugEnabled ? '🐞' : '🚫';
        this.button.title = this.debugEnabled ? 'Disable Debug' : 'Enable Debug';
        this.button.style.borderColor = this.debugEnabled ? 'rgba(0, 255, 0, 0.5)' : 'rgba(255, 80, 80, 0.7)';
    }

    /** Show the button */
    public show(): void {
        if (this.container) this.container.style.display = 'block';
    }

    /** Hide the button */
    public hide(): void {
        if (this.container) this.container.style.display = 'none';
    }

    /** Dispose and cleanup */
    public dispose(): void {
        if (this.container && this.container.parentElement) {
            this.container.parentElement.removeChild(this.container);
        }
        this.button = undefined;
        this.container = undefined;
        Logger.info('Debug toggle button disposed');
    }
}
