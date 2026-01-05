import * as BABYLONGUI from '@babylonjs/gui';
import { InputSystem } from '../systems/InputSystem';
import { Logger } from '../core/Logger';

/**
 * Visual indicators showing active input state
 */
export class InputDebugUI {
    private advancedTexture: BABYLONGUI.AdvancedDynamicTexture;
    private keyIndicators: Map<string, BABYLONGUI.Rectangle> = new Map();
    private mouseIndicator: BABYLONGUI.TextBlock;
    private container?: BABYLONGUI.Container;
    
    constructor(private inputSystem: InputSystem, sharedTexture?: BABYLONGUI.AdvancedDynamicTexture) {
        this.advancedTexture = sharedTexture || BABYLONGUI.AdvancedDynamicTexture.CreateFullscreenUI('DebugUI');
        this.createKeyIndicators();
        this.createMouseIndicator();
        Logger.debug('Input debug UI created');
    }
    
    /**
     * Create visual indicators for WASD keys
     */
    private createKeyIndicators(): void {
        const keys = [
            { key: 'w', label: 'W', x: 0, y: -120 },
            { key: 'a', label: 'A', x: -40, y: -80 },
            { key: 's', label: 'S', x: 0, y: -80 },
            { key: 'd', label: 'D', x: 40, y: -80 },
            { key: 'arrowup', label: '↑', x: 140, y: -120 },
            { key: 'arrowleft', label: '←', x: 100, y: -80 },
            { key: 'arrowdown', label: '↓', x: 140, y: -80 },
            { key: 'arrowright', label: '→', x: 180, y: -80 },
            { key: ' ', label: 'SPACE', x: 0, y: -40 },
            { key: 'shift', label: 'SHIFT', x: 0, y: 0 }
        ];
        
        keys.forEach(({ key, label, x, y }) => {
            const rect = new BABYLONGUI.Rectangle();
            rect.width = label === 'SPACE' ? '80px' : '35px';
            rect.height = '35px';
            rect.cornerRadius = 5;
            rect.color = 'white';
            rect.thickness = 2;
            rect.background = 'rgba(0, 0, 0, 0.5)';
            rect.horizontalAlignment = BABYLONGUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
            rect.verticalAlignment = BABYLONGUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
            rect.left = 50 + x;
            rect.top = y;
            
            const text = new BABYLONGUI.TextBlock();
            text.text = label;
            text.color = 'white';
            text.fontSize = label.length === 1 && label.charCodeAt(0) > 127 ? 20 : 14; // Larger for arrows
            rect.addControl(text);
            
            this.advancedTexture.addControl(rect);
            this.keyIndicators.set(key, rect);
        });
    }
    
    /**
     * Create mouse position indicator
     */
    private createMouseIndicator(): void {
        this.mouseIndicator = new BABYLONGUI.TextBlock();
        this.mouseIndicator.text = 'Mouse: (0, 0)';
        this.mouseIndicator.color = 'white';
        this.mouseIndicator.fontSize = 14;
        this.mouseIndicator.horizontalAlignment = BABYLONGUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.mouseIndicator.verticalAlignment = BABYLONGUI.Control.VERTICAL_ALIGNMENT_TOP;
        this.mouseIndicator.left = 10;
        this.mouseIndicator.top = 60;
        this.advancedTexture.addControl(this.mouseIndicator);
    }
    
    /**
     * Update indicators based on current input state
     */
    public update(): void {
        const input = this.inputSystem.getState();
        
        // Update key indicators
        this.keyIndicators.forEach((rect, key) => {
            if (input.isKeyDown(key)) {
                rect.background = 'rgba(76, 175, 80, 0.8)'; // Green when pressed
                rect.thickness = 3;
            } else {
                rect.background = 'rgba(0, 0, 0, 0.5)';
                rect.thickness = 2;
            }
        });
        
        // Update mouse position
        const mousePos = input.getMousePosition();
        this.mouseIndicator.text = `Mouse: (${Math.round(mousePos.x)}, ${Math.round(mousePos.y)})`;
    }
    
    /**
     * Toggle visibility of input debug UI
     */
    public toggle(): void {
        const newVisibility = !this.mouseIndicator.isVisible;
        this.mouseIndicator.isVisible = newVisibility;
        this.keyIndicators.forEach((rect) => {
            rect.isVisible = newVisibility;
        });
    }

    /** Show all debug controls */
    public show(): void {
        this.mouseIndicator.isVisible = true;
        this.keyIndicators.forEach((rect) => {
            rect.isVisible = true;
        });
    }

    /** Hide all debug controls */
    public hide(): void {
        this.mouseIndicator.isVisible = false;
        this.keyIndicators.forEach((rect) => {
            rect.isVisible = false;
        });
    }
    
    /**
     * Cleanup
     */
    public dispose(): void {
        // Remove controls but don't dispose the shared texture
        this.keyIndicators.forEach((rect) => {
            this.advancedTexture.removeControl(rect);
        });
        this.advancedTexture.removeControl(this.mouseIndicator);
        Logger.debug('Input debug UI disposed');
    }
}
