import * as BABYLON from '@babylonjs/core';
import { Entity } from './Entity';
import { InputSystem } from '../systems/InputSystem';

/**
 * Test cube entity - demonstrates Entity usage with input-based movement
 */
export class TestCube extends Entity {
    private inputSystem: InputSystem;
    
    constructor(scene: BABYLON.Scene, inputSystem: InputSystem) {
        super('TestCube', scene);
        this.inputSystem = inputSystem;
    }
    
    /**
     * Initialize the cube mesh and material
     */
    public init(): void {
        // Create cube mesh
        this.mesh = BABYLON.MeshBuilder.CreateBox(this.name, { size: 2 }, this.scene);
        this.position = new BABYLON.Vector3(0, 1, 0);
        
        // Add material with color
        const material = new BABYLON.StandardMaterial(`${this.name}_Material`, this.scene);
        material.diffuseColor = new BABYLON.Color3(0.4, 0.8, 1.0);
        material.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
        (this.mesh as BABYLON.Mesh).material = material;
    }
    
    /**
     * Update cube each frame - handle input and rotation
     */
    public update(deltaTime: number): void {
        if (!this.isActive || !this.mesh) return;
        
        const input = this.inputSystem.getState();
        const movement = input.getMovementInput();
        
        // Move cube with WASD/Arrows
        const moveSpeed = input.isSprintPressed() ? 0.01 : 0.005;
        this.position = new BABYLON.Vector3(
            this.position.x + movement.x * moveSpeed * deltaTime,
            this.position.y,
            this.position.z + movement.y * moveSpeed * deltaTime
        );
        
        // Jump with Space
        if (input.isJumpPressed()) {
            this.position = new BABYLON.Vector3(
                this.position.x,
                this.position.y + 0.005 * deltaTime,
                this.position.z
            );
        }
        
        // Rotate cube continuously for visual feedback
        this.rotation = new BABYLON.Vector3(
            this.rotation.x + 0.005,
            this.rotation.y + 0.01,
            this.rotation.z
        );
    }
}
