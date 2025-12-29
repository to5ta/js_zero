import * as BABYLONGUI from '@babylonjs/gui';
import { SimplePlayer } from '../entities/SimplePlayer';
import { Logger } from '../core/Logger';

/**
 * Displays player debug information on screen
 */
export class PlayerDebugUI {
    private advancedTexture: BABYLONGUI.AdvancedDynamicTexture;
    private container: BABYLONGUI.Rectangle;
    private slopeContainer?: BABYLONGUI.Rectangle;
    private positionText: BABYLONGUI.TextBlock;
    private velocityText: BABYLONGUI.TextBlock;
    private stateText: BABYLONGUI.TextBlock;
    private slopeText: BABYLONGUI.TextBlock;
    private forceText: BABYLONGUI.TextBlock;
    private inputText: BABYLONGUI.TextBlock;
    
    constructor(private player: SimplePlayer, sharedTexture?: BABYLONGUI.AdvancedDynamicTexture) {
        // Use shared texture or create new one
        this.advancedTexture = sharedTexture || BABYLONGUI.AdvancedDynamicTexture.CreateFullscreenUI('DebugUI');
        
        // Create container panel
        this.container = new BABYLONGUI.Rectangle();
        this.container.width = '320px';
        this.container.height = '160px';
        this.container.cornerRadius = 10;
        this.container.color = 'white';
        this.container.thickness = 2;
        this.container.background = 'rgba(0, 0, 0, 0.7)';
        this.container.horizontalAlignment = BABYLONGUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        this.container.verticalAlignment = BABYLONGUI.Control.VERTICAL_ALIGNMENT_TOP;
        this.container.top = 10;
        this.container.left = -10;
        this.advancedTexture.addControl(this.container);
        
        // Create title
        const title = new BABYLONGUI.TextBlock();
        title.text = '🎮 PLAYER DEBUG';
        title.color = '#4CAF50';
        title.fontSize = 16;
        title.fontWeight = 'bold';
        title.textHorizontalAlignment = BABYLONGUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        title.textVerticalAlignment = BABYLONGUI.Control.VERTICAL_ALIGNMENT_TOP;
        title.top = 5;
        title.left = 10;
        title.height = '20px';
        this.container.addControl(title);
        
        // Create position text
        this.positionText = new BABYLONGUI.TextBlock();
        this.positionText.text = 'Position: (0, 0, 0)';
        this.positionText.color = 'white';
        this.positionText.fontSize = 13;
        this.positionText.textHorizontalAlignment = BABYLONGUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.positionText.textVerticalAlignment = BABYLONGUI.Control.VERTICAL_ALIGNMENT_TOP;
        this.positionText.top = 28;
        this.positionText.left = 10;
        this.positionText.height = '20px';
        this.container.addControl(this.positionText);
        
        // Create velocity text
        this.velocityText = new BABYLONGUI.TextBlock();
        this.velocityText.text = 'Speed: 0.00';
        this.velocityText.color = 'white';
        this.velocityText.fontSize = 13;
        this.velocityText.textHorizontalAlignment = BABYLONGUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.velocityText.textVerticalAlignment = BABYLONGUI.Control.VERTICAL_ALIGNMENT_TOP;
        this.velocityText.top = 50;
        this.velocityText.left = 10;
        this.velocityText.height = '20px';
        this.container.addControl(this.velocityText);
        
        // Create state text
        this.stateText = new BABYLONGUI.TextBlock();
        this.stateText.text = 'State: Idle';
        this.stateText.color = 'white';
        this.stateText.fontSize = 13;
        this.stateText.textHorizontalAlignment = BABYLONGUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.stateText.textVerticalAlignment = BABYLONGUI.Control.VERTICAL_ALIGNMENT_TOP;
        this.stateText.top = 72;
        this.stateText.left = 10;
        this.stateText.height = '20px';
        this.container.addControl(this.stateText);
        
        // Create force text
        this.forceText = new BABYLONGUI.TextBlock();
        this.forceText.text = 'Force: (0, 0, 0)';
        this.forceText.color = '#FFD700';
        this.forceText.fontSize = 13;
        this.forceText.textHorizontalAlignment = BABYLONGUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.forceText.textVerticalAlignment = BABYLONGUI.Control.VERTICAL_ALIGNMENT_TOP;
        this.forceText.top = 94;
        this.forceText.left = 10;
        this.forceText.height = '20px';
        this.container.addControl(this.forceText);
        
        // Create input text
        this.inputText = new BABYLONGUI.TextBlock();
        this.inputText.text = 'Input: None';
        this.inputText.color = '#90EE90';
        this.inputText.fontSize = 13;
        this.inputText.textHorizontalAlignment = BABYLONGUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.inputText.textVerticalAlignment = BABYLONGUI.Control.VERTICAL_ALIGNMENT_TOP;
        this.inputText.top = 116;
        this.inputText.left = 10;
        this.inputText.height = '20px';
        this.container.addControl(this.inputText);
        
        // Create slope indicator with background (standalone, upper left)
        this.slopeContainer = new BABYLONGUI.Rectangle();
        this.slopeContainer.width = '250px';
        this.slopeContainer.height = '50px';
        this.slopeContainer.cornerRadius = 5;
        this.slopeContainer.color = 'yellow'; // Bright color for debugging
        this.slopeContainer.thickness = 2;
        this.slopeContainer.background = 'rgba(0, 0, 0, 0.7)';
        this.slopeContainer.horizontalAlignment = BABYLONGUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.slopeContainer.verticalAlignment = BABYLONGUI.Control.VERTICAL_ALIGNMENT_TOP;
        this.slopeContainer.left = 80;
        this.slopeContainer.top = 10;
        this.advancedTexture.addControl(this.slopeContainer);
        
        this.slopeText = new BABYLONGUI.TextBlock();
        this.slopeText.text = '⛰️ Slope: 0.0°';
        this.slopeText.color = 'yellow'; // Bright color for debugging
        this.slopeText.fontSize = 14;
        this.slopeText.fontWeight = 'bold';
        this.slopeContainer.addControl(this.slopeText);
        
        Logger.debug('Player debug UI created - slope indicator added with container');
    }
    
    /**
     * Update display with current player data
     */
    public update(): void {
        const pos = this.player.position;
        this.positionText.text = `Position: (${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)})`;
        
        // Get velocity from player (NO PHYSICS)
        const velocity = this.player.getCurrentVelocity();
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y + velocity.z * velocity.z);
        this.velocityText.text = `Velocity: (${velocity.x.toFixed(2)}, ${velocity.y.toFixed(2)}, ${velocity.z.toFixed(2)}) | ${speed.toFixed(2)} m/s`;
        
        // Show grounded state
        const isGrounded = this.player.getIsGrounded();
        const groundEmoji = isGrounded ? '🟢' : '🔴';
        this.stateText.text = `Grounded: ${groundEmoji} ${isGrounded ? 'Yes' : 'No'}`;
        
        // Update slope display
        const slopeAngle = this.player.getSlopeAngle();
        const groundDist = this.player.getGroundDistance();
        const maxSlope = 45;
        
        // Show slope if hit detected (even if not grounded)
        if (groundDist > 0) {
            if (isGrounded) {
                // Grounded - show yellow for walkable, red for too steep
                if (slopeAngle <= maxSlope) {
                    this.slopeText.color = 'yellow';
                    if (this.slopeContainer) this.slopeContainer.color = 'yellow';
                } else {
                    this.slopeText.color = 'red';
                    if (this.slopeContainer) this.slopeContainer.color = 'red';
                }
                this.slopeText.text = `⛰️ Slope: ${slopeAngle.toFixed(1)}° | Dist: ${groundDist.toFixed(3)}`;
            } else {
                // Not grounded but hit detected - show in cyan/blue
                this.slopeText.color = 'cyan';
                if (this.slopeContainer) this.slopeContainer.color = 'cyan';
                this.slopeText.text = `⛰️ Slope: ${slopeAngle.toFixed(1)}° | Dist: ${groundDist.toFixed(3)} (preview)`;
            }
        } else {
            // No hit detected
            this.slopeText.color = 'gray';
            if (this.slopeContainer) this.slopeContainer.color = 'gray';
            this.slopeText.text = `⛰️ No Ground Detected`;
        }
        
        // Show velocity magnitude instead of force
        this.forceText.text = `Speed: ${speed.toFixed(1)} m/s`;
        
        // Show movement input direction
        const moveDir = this.player.getLastMoveDirection();
        if (moveDir.length() > 0.01) {
            this.inputText.text = `Input: (${moveDir.x.toFixed(2)}, ${moveDir.y.toFixed(2)}, ${moveDir.z.toFixed(2)})`;
        } else {
            this.inputText.text = `Input: None`;
        }
    }
    
    /**
     * Show the UI
     */
    public show(): void {
        this.container.isVisible = true;
        if (this.slopeContainer) this.slopeContainer.isVisible = true;
    }
    
    /**
     * Hide the UI
     */
    public hide(): void {
        this.container.isVisible = false;
        if (this.slopeContainer) this.slopeContainer.isVisible = false;
    }
    
    /**
     * Toggle visibility
     */
    public toggle(): void {
        this.container.isVisible = !this.container.isVisible;
        if (this.slopeContainer) this.slopeContainer.isVisible = !this.slopeContainer.isVisible;
    }
    
    /**
     * Cleanup
     */
    public dispose(): void {
        Logger.debug('Disposing player debug UI');
        // Remove controls but don't dispose the shared texture
        this.advancedTexture.removeControl(this.container);
        if (this.slopeContainer) {
            this.advancedTexture.removeControl(this.slopeContainer);
        }
    }
}
