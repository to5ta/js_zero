import { InputState } from './InputState';
import { Logger } from '../core/Logger';

/**
 * Input system - manages input state and provides convenient queries
 */
export class InputSystem {
    private inputState: InputState;
    private enabled: boolean = true;
    
    constructor(canvas: HTMLCanvasElement) {
        this.inputState = new InputState(canvas);
        Logger.info('Input system initialized');
    }
    
    /**
     * Enable input processing
     */
    public enable(): void {
        this.enabled = true;
        Logger.debug('Input system enabled');
    }
    
    /**
     * Disable input processing
     */
    public disable(): void {
        this.enabled = false;
        this.inputState.clear();
        Logger.debug('Input system disabled');
    }
    
    /**
     * Check if input system is enabled
     */
    public isEnabled(): boolean {
        return this.enabled;
    }
    
    /**
     * Get the input state (for direct queries)
     */
    public getState(): InputState {
        return this.inputState;
    }
    
    /**
     * Update - called each frame (currently no-op, but useful for future features)
     */
    public update(deltaTime: number): void {
        if (!this.enabled) return;
        
        // Future: Handle input buffering, combo detection, etc.
    }
    
    /**
     * Cleanup
     */
    public dispose(): void {
        this.inputState.dispose();
        Logger.info('Input system disposed');
    }
}
