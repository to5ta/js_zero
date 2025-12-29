import * as BABYLON from '@babylonjs/core';

/**
 * Tracks current input state (keyboard, mouse, touch)
 */
export class InputState {
    // Keyboard state
    private keysDown = new Set<string>();
    
    // Mouse state
    private mousePosition: BABYLON.Vector2 = BABYLON.Vector2.Zero();
    private mouseButtons = new Set<number>();
    
    // Touch state (for mobile)
    private touches = new Map<number, BABYLON.Vector2>();
    
    // Pointer lock state
    private pointerLocked = false;
    private mouseDelta: BABYLON.Vector2 = BABYLON.Vector2.Zero();
    
    constructor(private canvas: HTMLCanvasElement) {
        this.setupEventListeners();
    }
    
    /**
     * Setup all input event listeners
     */
    private setupEventListeners(): void {
        // Keyboard events
        window.addEventListener('keydown', (e) => {
            this.keysDown.add(e.key.toLowerCase());
            this.keysDown.add(e.code.toLowerCase());
        });
        
        window.addEventListener('keyup', (e) => {
            this.keysDown.delete(e.key.toLowerCase());
            this.keysDown.delete(e.code.toLowerCase());
        });
        
        // Mouse events
        this.canvas.addEventListener('mousemove', (e) => {
            this.mousePosition.x = e.clientX;
            this.mousePosition.y = e.clientY;
            
            if (this.pointerLocked) {
                this.mouseDelta.x = e.movementX;
                this.mouseDelta.y = e.movementY;
            }
        });
        
        this.canvas.addEventListener('mousedown', (e) => {
            this.mouseButtons.add(e.button);
        });
        
        this.canvas.addEventListener('mouseup', (e) => {
            this.mouseButtons.delete(e.button);
        });
        
        // Touch events (mobile)
        this.canvas.addEventListener('touchstart', (e) => {
            for (let i = 0; i < e.touches.length; i++) {
                const touch = e.touches[i];
                this.touches.set(touch.identifier, new BABYLON.Vector2(touch.clientX, touch.clientY));
            }
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault(); // Prevent scrolling
            for (let i = 0; i < e.touches.length; i++) {
                const touch = e.touches[i];
                this.touches.set(touch.identifier, new BABYLON.Vector2(touch.clientX, touch.clientY));
            }
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                this.touches.delete(touch.identifier);
            }
        });
        
        // Pointer lock events
        document.addEventListener('pointerlockchange', () => {
            this.pointerLocked = document.pointerLockElement === this.canvas;
        });
    }
    
    /**
     * Check if a key is currently pressed
     */
    public isKeyDown(key: string): boolean {
        return this.keysDown.has(key.toLowerCase());
    }
    
    /**
     * Check if any of the provided keys are pressed
     */
    public isAnyKeyDown(...keys: string[]): boolean {
        return keys.some(key => this.isKeyDown(key));
    }
    
    /**
     * Get mouse position in screen coordinates
     */
    public getMousePosition(): BABYLON.Vector2 {
        return this.mousePosition.clone();
    }
    
    /**
     * Get mouse delta (movement since last frame) - only works with pointer lock
     */
    public getMouseDelta(): BABYLON.Vector2 {
        const delta = this.mouseDelta.clone();
        this.mouseDelta.set(0, 0); // Reset after reading
        return delta;
    }
    
    /**
     * Check if mouse button is pressed (0=left, 1=middle, 2=right)
     */
    public isMouseButtonDown(button: number): boolean {
        return this.mouseButtons.has(button);
    }
    
    /**
     * Get movement input as normalized vector (-1 to 1 on each axis)
     * WASD / Arrow keys
     */
    public getMovementInput(): BABYLON.Vector2 {
        const input = new BABYLON.Vector2(0, 0);
        
        // Forward/Backward
        if (this.isAnyKeyDown('w', 'arrowup')) input.y += 1;
        if (this.isAnyKeyDown('s', 'arrowdown')) input.y -= 1;
        
        // Left/Right
        if (this.isAnyKeyDown('d', 'arrowright')) input.x -= 1;  // D/Right = positive
        if (this.isAnyKeyDown('a', 'arrowleft')) input.x += 1;   // A/Left = negative
        
        // Normalize diagonal movement
        if (input.length() > 1) {
            input.normalize();
        }
        
        return input;
    }
    
    /**
     * Check if jump key is pressed (Space)
     */
    public isJumpPressed(): boolean {
        return this.isKeyDown(' ') || this.isKeyDown('space');
    }
    
    /**
     * Check if sprint key is pressed (Shift)
     */
    public isSprintPressed(): boolean {
        return this.isKeyDown('shift');
    }
    
    /**
     * Get all active touches (for mobile)
     */
    public getTouches(): Map<number, BABYLON.Vector2> {
        return new Map(this.touches);
    }
    
    /**
     * Request pointer lock (for FPS controls)
     */
    public requestPointerLock(): void {
        this.canvas.requestPointerLock();
    }
    
    /**
     * Exit pointer lock
     */
    public exitPointerLock(): void {
        document.exitPointerLock();
    }
    
    /**
     * Check if pointer is locked
     */
    public isPointerLocked(): boolean {
        return this.pointerLocked;
    }
    
    /**
     * Clear all input state (useful when losing focus)
     */
    public clear(): void {
        this.keysDown.clear();
        this.mouseButtons.clear();
        this.touches.clear();
        this.mouseDelta.set(0, 0);
    }
    
    /**
     * Cleanup event listeners
     */
    public dispose(): void {
        // Note: In production, you'd want to store bound references to remove them
        // For now, leaving as is since we don't dispose the app often
        this.clear();
    }
}
