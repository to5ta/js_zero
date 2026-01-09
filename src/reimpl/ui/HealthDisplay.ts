import * as BABYLONGUI from '@babylonjs/gui';
import { EventBus } from '../core/EventBus';
import { Logger } from '../core/Logger';

/**
 * Displays player health on screen
 */
export class HealthDisplay {
    private advancedTexture: BABYLONGUI.AdvancedDynamicTexture;
    private container: BABYLONGUI.Rectangle;
    private healthText: BABYLONGUI.TextBlock;
    private currentHealth: number = 100;
    private maxHealth: number = 100;
    
    constructor(private eventBus: EventBus, sharedTexture?: BABYLONGUI.AdvancedDynamicTexture) {
        // Use shared texture or create new one
        this.advancedTexture = sharedTexture || BABYLONGUI.AdvancedDynamicTexture.CreateFullscreenUI('HealthUI');
        
        // Create container panel
        this.container = new BABYLONGUI.Rectangle();
        this.container.width = '200px';
        this.container.height = '60px';
        this.container.cornerRadius = 10;
        this.container.color = 'white';
        this.container.thickness = 2;
        this.container.background = 'rgba(0, 0, 0, 0.7)';
        this.container.horizontalAlignment = BABYLONGUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.container.verticalAlignment = BABYLONGUI.Control.VERTICAL_ALIGNMENT_TOP;
        this.container.top = 10;
        this.container.left = 10;
        this.advancedTexture.addControl(this.container);
        
        // Create health text
        this.healthText = new BABYLONGUI.TextBlock();
        this.healthText.text = '❤️ 100';
        this.healthText.color = 'white';
        this.healthText.fontSize = 30;
        this.healthText.fontWeight = 'bold';
        this.healthText.verticalAlignment = BABYLONGUI.Control.VERTICAL_ALIGNMENT_CENTER;
        this.healthText.horizontalAlignment = BABYLONGUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        this.container.addControl(this.healthText);
        
        // Subscribe to health change events
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
        this.healthText.text = `❤️ ${health}`;
        
        // Change color based on health percentage
        const healthPercent = health / maxHealth;
        if (healthPercent > 0.6) {
            this.healthText.color = 'white';
        } else if (healthPercent > 0.3) {
            this.healthText.color = '#FFA500'; // Orange
        } else {
            this.healthText.color = '#FF4444'; // Red
        }
        
        // Flash on death
        if (health <= 0) {
            this.healthText.color = '#FF0000';
            this.healthText.text = '💀 DEAD';
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
