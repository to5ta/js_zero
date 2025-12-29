import * as BABYLON from '@babylonjs/core';
import { Entity } from './Entity';
import { InputSystem } from '../systems/InputSystem';
import { CameraController } from '../systems/CameraController';
import { Logger } from '../core/Logger';

/**
 * Simple player entity - capsule that moves with WASD/arrows
 * Direct movement control WITHOUT physics
 */
export class SimplePlayer extends Entity {
    private inputSystem: InputSystem;
    private cameraController?: CameraController;
    
    // Movement configuration
    private moveSpeed: number = 5.0; // Units per second
    private sprintMultiplier: number = 2.0;
    private currentVelocity: BABYLON.Vector3 = BABYLON.Vector3.Zero();
    
    // Physics properties
    private gravity: number = -9.81; // m/s^2
    private jumpSpeed: number = 6; // Initial jump velocity
    private isGrounded: boolean = false;
    private capsuleHeight: number = 2.0;
    private capsuleRadius: number = 0.5;
    private groundCheckDistance: number = 0.01; // Extra distance beyond half height
    
    // Debug properties
    private lastMoveDirection: BABYLON.Vector3 = BABYLON.Vector3.Zero();
    
    // Orientation axis visualization
    private axisX?: BABYLON.LinesMesh; // Red - Forward
    private axisY?: BABYLON.LinesMesh; // Green - Up
    private axisZ?: BABYLON.LinesMesh; // Blue - Left
    private playerRotation: number = 0; // Current rotation angle
    private groundRayLine?: BABYLON.LinesMesh; // Ground detection ray visualization
    
    constructor(scene: BABYLON.Scene, inputSystem: InputSystem) {
        super('Player', scene);
        this.inputSystem = inputSystem;
    }
    
    /**
     * Initialize the player capsule mesh and material (NO PHYSICS)
     */
    public init(): void {
        // Create capsule mesh
        this.mesh = BABYLON.MeshBuilder.CreateCapsule(
            this.name, 
            { 
                radius: this.capsuleRadius, 
                height: this.capsuleHeight,
                subdivisions: 16
            }, 
            this.scene
        );
        
        // Start at a reasonable height
        this.position = new BABYLON.Vector3(0, 2.0, 0);
        
        // Add material with player color
        const material = new BABYLON.StandardMaterial(`${this.name}_Material`, this.scene);
        material.diffuseColor = new BABYLON.Color3(0.2, 0.6, 1.0); // Blue player
        material.specularColor = new BABYLON.Color3(0.3, 0.3, 0.3);
        (this.mesh as BABYLON.Mesh).material = material;
        
        // Enable collision detection
        const capsuleMesh = this.mesh as BABYLON.Mesh;
        capsuleMesh.checkCollisions = true;
        capsuleMesh.ellipsoid = new BABYLON.Vector3(
            this.capsuleRadius,
            this.capsuleHeight / 2,
            this.capsuleRadius
        );
        
        // Create orientation axis lines
        this.createOrientationAxes();
        
        Logger.info('🎮 Player created with moveWithCollisions');
    }
    
    /**
     * Create orientation axis visualization
     * X (Red) - Forward, Y (Green) - Up, Z (Blue) - Left
     */
    private createOrientationAxes(): void {
        const axisLength = 2.0;
        const origin = this.position.clone();
        
        // X axis - Red (Forward) - updatable so we can modify it each frame
        this.axisX = BABYLON.MeshBuilder.CreateLines(
            'axisX',
            { 
                points: [origin, origin.add(new BABYLON.Vector3(axisLength, 0, 0))],
                updatable: true
            },
            this.scene
        );
        this.axisX.color = new BABYLON.Color3(1, 0, 0);
        this.axisX.alwaysSelectAsActiveMesh = true; // Prevent frustum culling
        
        // Y axis - Green (Up - always points up) - updatable
        this.axisY = BABYLON.MeshBuilder.CreateLines(
            'axisY',
            { 
                points: [origin, origin.add(new BABYLON.Vector3(0, axisLength, 0))],
                updatable: true
            },
            this.scene
        );
        this.axisY.color = new BABYLON.Color3(0, 1, 0);
        this.axisY.alwaysSelectAsActiveMesh = true; // Prevent frustum culling
        
        // Z axis - Blue (Left/Sideways) - updatable
        this.axisZ = BABYLON.MeshBuilder.CreateLines(
            'axisZ',
            { 
                points: [origin, origin.add(new BABYLON.Vector3(0, 0, axisLength))],
                updatable: true
            },
            this.scene
        );
        this.axisZ.color = new BABYLON.Color3(0, 0, 1);
        this.axisZ.alwaysSelectAsActiveMesh = true; // Prevent frustum culling
        
        // Ground detection ray visualization
        const rayLength = (this.capsuleHeight / 2) + this.groundCheckDistance;
        this.groundRayLine = BABYLON.MeshBuilder.CreateLines(
            'groundRay',
            {
                points: [origin, origin.add(new BABYLON.Vector3(0, -rayLength, 0))],
                updatable: true
            },
            this.scene
        );
        this.groundRayLine.color = new BABYLON.Color3(0.5, 0.5, 0.5); // Grey by default
        this.groundRayLine.alwaysSelectAsActiveMesh = true;
    }
    
    /**
     * Check if player is grounded using raycast
     */
    private checkGrounded(): void {
        if (!this.mesh) return;
        
        // Cast ray from player position downwards
        const rayOrigin = this.mesh.position.clone();
        const rayDirection = new BABYLON.Vector3(0, -1, 0);
        const rayLength = (this.capsuleHeight / 2) + this.groundCheckDistance;
        
        const ray = new BABYLON.Ray(rayOrigin, rayDirection, rayLength);
        const hit = this.scene.pickWithRay(ray, (mesh) => {
            // Don't collide with self
            return mesh !== this.mesh;
        });
        
        this.isGrounded = hit?.hit ?? false;
        
        // Update ray visualization
        if (this.groundRayLine) {
            const rayEnd = rayOrigin.add(rayDirection.scale(rayLength));
            this.groundRayLine = BABYLON.MeshBuilder.CreateLines(
                'groundRay',
                { points: [rayOrigin, rayEnd], instance: this.groundRayLine },
                this.scene
            );
            
            // Change color based on hit
            this.groundRayLine.color = this.isGrounded 
                ? new BABYLON.Color3(1, 1, 0)  // Yellow when hit
                : new BABYLON.Color3(0.5, 0.5, 0.5); // Grey when no hit
        }
    }
    
    /**
     * Update player each frame - direct position control
     */
    public update(deltaTime: number): void {
        if (!this.isActive || !this.mesh) {
            return;
        }
        
        const input = this.inputSystem.getState();
        const movement = input.getMovementInput();
        const deltaTimeSec = deltaTime / 1000; // Convert ms to seconds
        
        // Check if grounded
        this.checkGrounded();
        
        // Calculate desired speed
        const currentSpeed = input.isSprintPressed() 
            ? this.moveSpeed * this.sprintMultiplier 
            : this.moveSpeed;
        
        // Get camera-relative movement direction
        let moveDirection = BABYLON.Vector3.Zero();
        
        if (this.cameraController && movement.length() > 0.01) {
            const forward = this.cameraController.getForwardDirection();
            const right = this.cameraController.getRightDirection();
            
            moveDirection = forward.scale(-movement.y).add(right.scale(movement.x));
            moveDirection.normalize();
            this.lastMoveDirection = moveDirection.clone();
            
            // Update player rotation based on movement direction
            this.updatePlayerOrientation(moveDirection);
        } else {
            this.lastMoveDirection = BABYLON.Vector3.Zero();
        }
        
        // Handle jump input
        if (input.isJumpPressed() && this.isGrounded) {
            this.currentVelocity.y = this.jumpSpeed;
        }
        
        // Apply gravity when not grounded
        if (!this.isGrounded) {
            this.currentVelocity.y += this.gravity * deltaTimeSec;
        } else {
            // Reset vertical velocity when grounded
            if (this.currentVelocity.y < 0) {
                this.currentVelocity.y = 0;
            }
        }
        
        // Calculate horizontal velocity
        this.currentVelocity.x = moveDirection.x * currentSpeed;
        this.currentVelocity.z = moveDirection.z * currentSpeed;
        
        // Use moveWithCollisions for automatic collision response
        const velocity = this.currentVelocity.scale(deltaTimeSec);
        (this.mesh as BABYLON.Mesh).moveWithCollisions(velocity);
        
        // Update debug visualization
        this.updateOrientationAxes();
    }
    
    /**
     * Update orientation axes to reflect current rotation and player world position
     */
    private updateOrientationAxes(): void {
        if (!this.axisX || !this.axisY || !this.axisZ || !this.mesh) return;
        
        // Get player's current world position
        const playerWorldPos = this.mesh.getAbsolutePosition();
        
        // Calculate scale based on velocity
        const speed = this.currentVelocity.length();
        const baseLength = 2.0;
        const scaleFactor = 1.0 + (speed / this.moveSpeed);
        const axisLength = baseLength * scaleFactor;
        
        // Get current azimuth (rotation angle around Y axis)
        const azimuth = this.mesh.rotation.y;
        const cos = Math.cos(azimuth);
        const sin = Math.sin(azimuth);
        
        // Base directions (before rotation)
        const baseForward = new BABYLON.Vector3(0, 0, 1);  // +Z
        const baseRight = new BABYLON.Vector3(1, 0, 0);    // +X
        const baseUp = new BABYLON.Vector3(0, 1, 0);       // +Y
        
        // Rotate forward direction by azimuth
        const forwardRotated = new BABYLON.Vector3(
            baseForward.x * cos + baseForward.z * sin,
            baseForward.y,
            -baseForward.x * sin + baseForward.z * cos
        );
        const forwardOuter = playerWorldPos.add(forwardRotated.scale(axisLength));
        
        // Rotate right direction by azimuth
        const rightRotated = new BABYLON.Vector3(
            baseRight.x * cos + baseRight.z * sin,
            baseRight.y,
            -baseRight.x * sin + baseRight.z * cos
        );
        const rightOuter = playerWorldPos.add(rightRotated.scale(axisLength));
        
        // Up direction (no rotation, just scale)
        const upOuter = playerWorldPos.add(baseUp.scale(axisLength));
        
        // Update line positions using instance parameter
        this.axisX = BABYLON.MeshBuilder.CreateLines(
            'axisX',
            { points: [playerWorldPos, forwardOuter], instance: this.axisX },
            this.scene
        );
        
        this.axisZ = BABYLON.MeshBuilder.CreateLines(
            'axisZ',
            { points: [playerWorldPos, rightOuter], instance: this.axisZ },
            this.scene
        );
        
        this.axisY = BABYLON.MeshBuilder.CreateLines(
            'axisY',
            { points: [playerWorldPos, upOuter], instance: this.axisY },
            this.scene
        );
    }
    
    /**
     * Get current velocity for debugging
     */
    public getCurrentVelocity(): BABYLON.Vector3 {
        return this.currentVelocity;
    }
    
    /**
     * Set the camera controller for camera-relative movement
     */
    public setCameraController(cameraController: CameraController): void {
        this.cameraController = cameraController;
    }
    
    /**
     * Get current move speed
     */
    public getMoveSpeed(): number {
        return this.moveSpeed;
    }
    
    /**
     * Set move speed
     */
    public setMoveSpeed(speed: number): void {
        this.moveSpeed = speed;
    }
    
    /**
     * Get last movement direction for debugging
     */
    public getLastMoveDirection(): BABYLON.Vector3 {
        return this.lastMoveDirection;
    }
    
    /**
     * Get grounded state for debugging
     */
    public getIsGrounded(): boolean {
        return this.isGrounded;
    }
    
    /**
     * Update player orientation axes based on movement direction
     * Only updates when player is actively moving
     */
    private updatePlayerOrientation(moveDirection: BABYLON.Vector3): void {
        if (!this.mesh || moveDirection.length() < 0.01) return;
        
        // Calculate rotation angle from movement direction
        // atan2 gives us the angle in radians
        const targetRotation = Math.atan2(moveDirection.x, moveDirection.z);
        
        // Smooth rotation interpolation
        const rotationSpeed = 0.15;
        this.playerRotation = this.playerRotation + (targetRotation - this.playerRotation) * rotationSpeed;
        
        // Apply rotation to the mesh (only Y axis rotation)
        this.mesh.rotation.y = this.playerRotation;
    }
    
    /**
     * Dispose player and cleanup resources
     */
    public dispose(): void {
        // Dispose orientation axes
        if (this.axisX) this.axisX.dispose();
        if (this.axisY) this.axisY.dispose();
        if (this.axisZ) this.axisZ.dispose();
        if (this.groundRayLine) this.groundRayLine.dispose();
        
        super.dispose();
    }
}
