import * as BABYLONGUI from '@babylonjs/gui';
import { EventBus } from '../core/EventBus';
import { Logger } from '../core/Logger';

/**
 * Player health, as a slim bar in the top left.
 *
 * A bar rather than a number: the fraction remaining is the thing you read
 * mid-fight, and it costs no reading time. The number stays alongside it for
 * players who want the exact value.
 */
const BAR_WIDTH = 118;
const BAR_HEIGHT = 8;
const NUMBER_WIDTH = 42;

const IRON = '#272320';
const EDGE = 'rgba(198, 160, 94, 0.38)';
const TEXT = '#e8dfcc';
const FILL_HEALTHY = '#c6a05e';
const FILL_HURT = '#c8752f';
const FILL_CRITICAL = '#a33125';

export class HealthDisplay {
    private advancedTexture: BABYLONGUI.AdvancedDynamicTexture;
    private container: BABYLONGUI.Rectangle;
    private barTrack: BABYLONGUI.Rectangle;
    private barFill: BABYLONGUI.Rectangle;
    private healthText: BABYLONGUI.TextBlock;
    private currentHealth: number = 100;
    private maxHealth: number = 100;

    constructor(private eventBus: EventBus, sharedTexture?: BABYLONGUI.AdvancedDynamicTexture) {
        this.advancedTexture = sharedTexture || BABYLONGUI.AdvancedDynamicTexture.CreateFullscreenUI('HealthUI');

        this.container = new BABYLONGUI.Rectangle();
        this.container.width = `${BAR_WIDTH + NUMBER_WIDTH + 26}px`;
        this.container.height = '34px';
        this.container.cornerRadius = 8;
        this.container.color = EDGE;
        this.container.thickness = 1;
        this.container.background = IRON;
        this.container.horizontalAlignment = BABYLONGUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.container.verticalAlignment = BABYLONGUI.Control.VERTICAL_ALIGNMENT_TOP;
        this.container.top = 10;
        this.container.left = 10;
        this.advancedTexture.addControl(this.container);

        this.barTrack = new BABYLONGUI.Rectangle();
        this.barTrack.width = `${BAR_WIDTH}px`;
        this.barTrack.height = `${BAR_HEIGHT}px`;
        this.barTrack.cornerRadius = 4;
        this.barTrack.thickness = 0;
        this.barTrack.background = 'rgba(0, 0, 0, 0.5)';
        this.barTrack.horizontalAlignment = BABYLONGUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.barTrack.verticalAlignment = BABYLONGUI.Control.VERTICAL_ALIGNMENT_CENTER;
        this.barTrack.left = 10;
        this.container.addControl(this.barTrack);

        // Left-aligned so the fill drains towards the left edge rather than
        // shrinking towards its own centre.
        this.barFill = new BABYLONGUI.Rectangle();
        this.barFill.width = `${BAR_WIDTH}px`;
        this.barFill.height = `${BAR_HEIGHT}px`;
        this.barFill.cornerRadius = 4;
        this.barFill.thickness = 0;
        this.barFill.background = FILL_HEALTHY;
        this.barFill.horizontalAlignment = BABYLONGUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.barTrack.addControl(this.barFill);

        this.healthText = new BABYLONGUI.TextBlock();
        this.healthText.text = '100';
        this.healthText.color = TEXT;
        this.healthText.fontSize = 13;
        this.healthText.width = `${NUMBER_WIDTH}px`;
        this.healthText.horizontalAlignment = BABYLONGUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        this.healthText.textHorizontalAlignment = BABYLONGUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        this.healthText.verticalAlignment = BABYLONGUI.Control.VERTICAL_ALIGNMENT_CENTER;
        this.healthText.left = -10;
        this.container.addControl(this.healthText);

        this.eventBus.on('player:health-changed', (data) => {
            this.updateHealth(data.health, data.maxHealth);
        });

        Logger.debug('HealthDisplay created');
    }

    /**
     * Update health display
     */
    private updateHealth(health: number, maxHealth: number): void {
        this.currentHealth = health;
        this.maxHealth = maxHealth;

        const fraction = maxHealth > 0 ? Math.max(0, Math.min(1, health / maxHealth)) : 0;
        this.barFill.width = `${Math.round(BAR_WIDTH * fraction)}px`;
        this.barFill.isVisible = fraction > 0;

        if (fraction > 0.6) {
            this.barFill.background = FILL_HEALTHY;
        } else if (fraction > 0.3) {
            this.barFill.background = FILL_HURT;
        } else {
            this.barFill.background = FILL_CRITICAL;
        }

        if (health <= 0) {
            this.healthText.text = 'DEAD';
            this.healthText.color = FILL_CRITICAL;
            this.container.color = FILL_CRITICAL;
        } else {
            this.healthText.text = `${health}`;
            this.healthText.color = TEXT;
            this.container.color = EDGE;
        }
    }

    /**
     * Show health display
     */
    public show(): void {
        this.container.isVisible = true;
    }

    /**
     * Hide health display
     */
    public hide(): void {
        this.container.isVisible = false;
    }

    /**
     * Toggle health display visibility
     */
    public toggle(): void {
        this.container.isVisible = !this.container.isVisible;
    }

    /**
     * Dispose health display
     */
    public dispose(): void {
        this.container.dispose();
        Logger.debug('HealthDisplay disposed');
    }
}
