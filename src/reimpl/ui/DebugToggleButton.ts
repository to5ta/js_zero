import { Logger } from '../core/Logger';
import { applyIronSurface, icon, Theme } from './theme';

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
        this.container.style.top = 'calc(58px + env(safe-area-inset-top, 0px))';
        this.container.style.right = 'calc(10px + env(safe-area-inset-right, 0px))';
        this.container.style.zIndex = '10000';

        this.button = document.createElement('button');
        this.button.innerHTML = icon('debug', 18);
        this.button.setAttribute('aria-label', 'Toggle debug overlay');
        this.button.style.width = '40px';
        this.button.style.height = '40px';
        this.button.style.padding = '0';
        this.button.style.cursor = 'pointer';
        this.button.style.display = 'flex';
        this.button.style.justifyContent = 'center';
        this.button.style.alignItems = 'center';
        this.button.style.transition = 'background 120ms linear, color 120ms linear';
        this.button.style.touchAction = 'manipulation';
        applyIronSurface(this.button, '10px');

        this.button.addEventListener('mouseenter', () => {
            if (this.button) this.button.style.background = Theme.ironPressed;
        });

        this.button.addEventListener('mouseleave', () => {
            if (this.button) this.button.style.background = Theme.ironRaised;
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
     * Update label/icon to reflect current state.
     *
     * The glyph stays the same either way and the brass tint carries the state,
     * so the control never turns into a different-looking button mid-session.
     */
    private updateButtonState(): void {
        if (!this.button) return;
        this.button.title = this.debugEnabled ? 'Disable Debug' : 'Enable Debug';
        this.button.style.color = this.debugEnabled ? Theme.brassBright : Theme.text;
        this.button.style.borderColor = this.debugEnabled ? Theme.brass : Theme.edge;
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
