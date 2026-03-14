import * as BABYLON from '@babylonjs/core';
import { Environment } from '../core/Environment';

/**
 * Tracks current input state (keyboard, mouse, touch)
 */
export class InputState {
    // Keyboard state
    private keysDown = new Set<string>();
    private virtualMovementInput: BABYLON.Vector2 = BABYLON.Vector2.Zero();
    private virtualLookInput: BABYLON.Vector2 = BABYLON.Vector2.Zero();
    private virtualJumpPressed: boolean = false;
    private virtualActionPressed: boolean = false;
    
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
        if (!Environment.isMobile) {
            this.setupPointerLock();
        }
    }
    
    /**
     * Setup pointer lock on canvas click
     */
    private setupPointerLock(): void {
        this.canvas.addEventListener('click', () => {
            if (!this.pointerLocked) {
                console.log('[TRACE] Canvas clicked, requesting pointer lock only');
                this.requestPointerLock();
            }
        });
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
            this.pointerLocked = document.pointerLockElement === (this.canvas as unknown as Element);
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
        if (this.isAnyKeyDown('d', 'arrowright')) input.x -= 1;
        if (this.isAnyKeyDown('a', 'arrowleft')) input.x += 1;

        // Virtual joystick input follows the same convention as keyboard input
        input.addInPlace(this.virtualMovementInput);
        
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
        return this.isKeyDown(' ') || this.isKeyDown('space') || this.virtualJumpPressed;
    }

    /**
     * Check if action input is pressed (mobile action button for now)
     */
    public isActionPressed(): boolean {
        return this.virtualActionPressed;
    }
    
    /**
     * Check if sprint key is pressed (Shift)
     */
    public isSprintPressed(): boolean {
        return this.isKeyDown('shift');
    }

    /**
     * Get current virtual look stick input
     */
    public getLookInput(): BABYLON.Vector2 {
        return this.virtualLookInput.clone();
    }

    /**
     * Set movement input from virtual/mobile controls
     */
    public setVirtualMovementInput(input: BABYLON.Vector2): void {
        this.virtualMovementInput.copyFrom(input);
    }

    /**
     * Set look input from virtual/mobile controls
     */
    public setVirtualLookInput(input: BABYLON.Vector2): void {
        this.virtualLookInput.copyFrom(input);
    }

    /**
     * Set mobile jump button state
     */
    public setVirtualJumpPressed(pressed: boolean): void {
        this.virtualJumpPressed = pressed;
    }

    /**
     * Set mobile action button state
     */
    public setVirtualActionPressed(pressed: boolean): void {
        this.virtualActionPressed = pressed;
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
     * Request fullscreen
     */
    public requestFullscreen(): void {
        console.log('[TRACE] requestFullscreen() called');
        console.log('[TRACE] document.documentElement:', document.documentElement);
        console.log('[TRACE] requestFullscreen exists?', !!document.documentElement.requestFullscreen);
        
        try {
            if (document.documentElement.requestFullscreen) {
                console.log('[TRACE] Calling document.documentElement.requestFullscreen()');
                const promise = document.documentElement.requestFullscreen();
                console.log('[TRACE] requestFullscreen() returned promise:', promise);

                promise
                    .then(() => {
                        console.log('[SUCCESS] Fullscreen request succeeded!');
                    })
                    .catch((err) => {
                        console.error('[ERROR] Fullscreen request failed:', err);
                        console.error('[ERROR] Error name:', err.name);
                        console.error('[ERROR] Error message:', err.message);
                        console.error('[ERROR] Error stack:', err.stack);
                    });
            } else {
                console.warn('[WARN] requestFullscreen not available on document.documentElement');
            }
        } catch (error) {
            console.error('[EXCEPTION] Exception during requestFullscreen:', error);
        }
    }
    
    /**
     * Request both pointer lock and fullscreen
     */
    public requestPointerLockAndFullscreen(): void {
        console.log('[TRACE] requestPointerLockAndFullscreen() called');
        this.requestFullscreen();
        this.requestPointerLock();
    }
    
    /**
     * Exit pointer lock
     */
    public exitPointerLock(): void {
        console.log('[TRACE] exitPointerLock() called');
        try {
            document.exitPointerLock();
            console.log('[SUCCESS] exitPointerLock() completed');
        } catch (error) {
            console.warn('[ERROR] Exit pointer lock failed:', error);
        }
    }
    
    /**
     * Exit fullscreen
     */
    public exitFullscreen(): void {
        console.log('[TRACE] exitFullscreen() called');
        console.log('[TRACE] document.exitFullscreen exists?', !!document.exitFullscreen);
        
        try {
            if (document.exitFullscreen) {
                console.log('[TRACE] Calling document.exitFullscreen()');
                const promise = document.exitFullscreen();

                promise
                    .then(() => {
                        console.log('[SUCCESS] Exit fullscreen succeeded!');
                    })
                    .catch((err) => {
                        console.error('[ERROR] Exit fullscreen failed:', err);
                    });
            } else {
                console.warn('[WARN] exitFullscreen not available');
            }
        } catch (error) {
            console.error('[EXCEPTION] Exception during exitFullscreen:', error);
        }
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
        this.virtualMovementInput.set(0, 0);
        this.virtualLookInput.set(0, 0);
        this.virtualJumpPressed = false;
        this.virtualActionPressed = false;
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
