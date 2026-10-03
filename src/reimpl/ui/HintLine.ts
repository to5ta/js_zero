import { applyIronSurface } from './theme';

/**
 * One line of text, shown only when the player appears to be stuck.
 *
 * Deliberately not an opening info box: those get dismissed before the thing
 * they explain is on screen. This waits until the player has already opened the
 * gate once and still has not gone through, which is the moment the wrong
 * reading — looking for a third block that does not exist — takes hold.
 */
export class HintLine {
    private readonly element: HTMLDivElement;
    private hideTimer?: number;

    constructor() {
        this.element = document.createElement('div');
        this.element.style.position = 'fixed';
        this.element.style.top = 'calc(64px + env(safe-area-inset-top, 0px))';
        this.element.style.left = '50%';
        this.element.style.transform = 'translateX(-50%)';
        this.element.style.maxWidth = 'min(80vw, 420px)';
        this.element.style.padding = '8px 16px';
        this.element.style.fontSize = '13px';
        this.element.style.lineHeight = '1.5';
        this.element.style.textAlign = 'center';
        this.element.style.zIndex = '10001';
        this.element.style.pointerEvents = 'none';
        this.element.style.opacity = '0';
        this.element.style.transition = 'opacity 400ms linear';
        applyIronSurface(this.element, '999px');
        document.body.appendChild(this.element);
    }

    /** Fades in, holds, fades out. Calling it again restarts the hold. */
    public show(text: string, holdSeconds = 7): void {
        this.element.textContent = text;
        this.element.style.opacity = '1';

        if (this.hideTimer !== undefined) {
            window.clearTimeout(this.hideTimer);
        }
        this.hideTimer = window.setTimeout(() => {
            this.element.style.opacity = '0';
            this.hideTimer = undefined;
        }, holdSeconds * 1000);
    }

    public hide(): void {
        if (this.hideTimer !== undefined) {
            window.clearTimeout(this.hideTimer);
            this.hideTimer = undefined;
        }
        this.element.style.opacity = '0';
    }

    public dispose(): void {
        if (this.hideTimer !== undefined) {
            window.clearTimeout(this.hideTimer);
        }
        this.element.remove();
    }
}
