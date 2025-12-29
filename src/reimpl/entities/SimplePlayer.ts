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
    private groundCheckDistance: number = 0.3; // Extra distance beyond half height for slope detection
    private groundNormal: BABYLON.Vector3 = BABYLON.Vector3.Up(); // Current ground surface normal
    private slopeAngle: number = 0; // Slope angle in degrees
    private maxWalkableSlope: number = 45; // Maximum slope angle in degrees that player can walk on
    private groundDistance: number = 0; // Distance to ground from raycast hit
    
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
        
        // Store ground distance for debugging
        this.groundDistance = hit?.distance ?? 0;
        
        // Get ground normal if hit (even if not grounded, for slope preview)
        if (hit?.hit) {
            this.groundNormal = hit.getNormal(true) ?? BABYLON.Vector3.Up();
            // Calculate slope angle in degrees
            this.slopeAngle = Math.acos(BABYLON.Vector3.Dot(this.groundNormal, BABYLON.Vector3.Up())) * (180 / Math.PI);
        } else {
            this.groundNormal = BABYLON.Vector3.Up();
            this.slopeAngle = 0;
        }
        
        // Only consider grounded if:
        // 1. Hit detected
        // 2. Distance is within capsule half-height (plus tolerance that accounts for slopes)
        // 3. Slope angle is walkable (not too steep)
        // On slopes, the raycast distance is longer because contact point isn't directly below
        // Use a more generous tolerance to account for this
        const baseThreshold = this.capsuleHeight / 2;
        const slopeTolerance = 0.1 + (this.slopeAngle / 90) * 0.2; // More tolerance on steeper slopes
        const groundThreshold = baseThreshold + slopeTolerance;
        
        this.isGrounded = (
            hit?.hit && 
            this.groundDistance <= groundThreshold && 
            this.slopeAngle <= this.maxWalkableSlope
        ) ?? false;
        
        // Update ray visualization
        if (this.groundRayLine) {
            const rayEnd = rayOrigin.add(rayDirection.scale(rayLength));
            this.groundRayLine = BABYLON.MeshBuilder.CreateLines(
                'groundRay',
                { points: [rayOrigin, rayEnd], instance: this.groundRayLine },
                this.scene
            );
            
            // Change color based on hit and slope
            if (this.isGrounded) {
                // Yellow for flat/walkable, red for too steep
                this.groundRayLine.color = this.slopeAngle <= this.maxWalkableSlope
                    ? new BABYLON.Color3(1, 1, 0)  // Yellow when walkable
                    : new BABYLON.Color3(1, 0, 0);  // Red when too steep
            } else {
                this.groundRayLine.color = new BABYLON.Color3(0.5, 0.5, 0.5); // Grey when no hit
            }
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
            
            // Anti-slide logic for slopes
            if (this.slopeAngle > 0.1 && this.slopeAngle <= this.maxWalkableSlope) {
                // Project gravity onto the slope plane to get slide force
                const gravityVec = new BABYLON.Vector3(0, this.gravity, 0);
                const slideForce = gravityVec.subtract(this.groundNormal.scale(BABYLON.Vector3.Dot(gravityVec, this.groundNormal)));
                
                // If not moving (or moving very little), apply counter-force to prevent sliding
                const movementMagnitude = movement.length();
                if (movementMagnitude < 0.1) {
                    // Apply full friction - cancel out slide force
                    this.currentVelocity.x -= slideForce.x * deltaTimeSec;
                    this.currentVelocity.z -= slideForce.z * deltaTimeSec;
                } else {
                    // When moving, apply partial friction based on movement direction
                    // This helps prevent sliding when walking across slopes
                    const frictionFactor = 0.5;
                    this.currentVelocity.x -= slideForce.x * deltaTimeSec * frictionFactor;
                    this.currentVelocity.z -= slideForce.z * deltaTimeSec * frictionFactor;
                }
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
     * Get current slope angle in degrees for debugging
     */
    public getSlopeAngle(): number {
        return this.slopeAngle;
    }
    
    /**
     * Get ground normal vector for debugging
     */
    public getGroundNormal(): BABYLON.Vector3 {
        return this.groundNormal;
    }
    
    /**
     * Get ground distance for debugging
     */
    public getGroundDistance(): number {
        return this.groundDistance;
    }
    
    /**
     * Get max walkable slope angle
     */
    public getMaxWalkableSlope(): number {
        return this.maxWalkableSlope;
    }
    
    /**
     * Set max walkable slope angle (surfaces steeper than this won't be considered grounded)
     */
    public setMaxWalkableSlope(angle: number): void {
        this.maxWalkableSlope = Math.max(0, Math.min(90, angle)); // Clamp between 0-90 degrees
        Logger.info(`Max walkable slope set to ${this.maxWalkableSlope.toFixed(1)}°`);
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
