import * as BABYLON from '@babylonjs/core';
import { Entity } from './Entity';
import { InputSystem } from '../systems/InputSystem';
import { CameraController } from '../systems/CameraController';
import { Logger } from '../core/Logger';
import { PlayerVisualization } from '../components/PlayerVisualization';
import { EventBus } from '../core/EventBus';

/**
 * Simple player entity - capsule that moves with WASD/arrows
 * Direct movement control WITHOUT physics
 */
export class SimplePlayer extends Entity {
    private inputSystem: InputSystem;
    private cameraController?: CameraController;
    private visualization?: PlayerVisualization;
    private eventBus: EventBus;
    private _position: BABYLON.Vector3 = BABYLON.Vector3.Zero(); // Explicit player position
    
    // Movement configuration
    private moveSpeed: number = 5.0; // Units per second
    private sprintMultiplier: number = 2.0;
    private currentVelocity: BABYLON.Vector3 = BABYLON.Vector3.Zero();
    
    // Physics properties
    private gravity: number = -22.0; // Stronger gravity for snappier landings
    private jumpSpeed: number = 8; // Initial jump velocity (increased to compensate for stronger gravity)
    private isGrounded: boolean = false;
    private hasJumped: boolean = false; // Prevents re-jumping while space is held
    private capsuleHeight: number = 2.0;
    private capsuleRadius: number = 0.5;
    private groundCheckDistance: number = 0.3; // Extra distance beyond half height for slope detection
    private groundNormal: BABYLON.Vector3 = BABYLON.Vector3.Up(); // Current ground surface normal
    private slopeAngle: number = 0; // Slope angle in degrees
    private maxWalkableSlope: number = 45; // Maximum slope angle in degrees that player can walk on
    private groundDistance: number = 0; // Distance to ground from raycast hit
    
    // Health system
    private health: number = 100;
    private readonly MAX_HEALTH: number = 100;
    private readonly FALL_DAMAGE_THRESHOLD: number = 12; // Safe landing speed (units/s) - ~3-4m fall
    private readonly FALL_DAMAGE_FACTOR: number = 15; // Damage multiplier for excess speed
    private isDead: boolean = false;
    
    // Fall damage detection
    private previousVelocity: BABYLON.Vector3 = BABYLON.Vector3.Zero();
    private previousGrounded: boolean = false;
    
    // Debug properties
    private lastMoveDirection: BABYLON.Vector3 = BABYLON.Vector3.Zero();
    private static debugVisualsEnabled: boolean = false; // Global debug toggle
    
    // Orientation axis visualization
    private axisX?: BABYLON.LinesMesh; // Red - Forward
    private axisY?: BABYLON.LinesMesh; // Green - Up
    private axisZ?: BABYLON.LinesMesh; // Blue - Left
    private slopeForwardLine?: BABYLON.LinesMesh; // Orange-red - Slope-adjusted forward
    private playerRotation: number = 0; // Current rotation angle
    private visualizationYawOffset: number = Math.PI; // Model forward points opposite logical forward
    private groundRayLine?: BABYLON.LinesMesh; // Ground detection ray visualization
    
    constructor(scene: BABYLON.Scene, inputSystem: InputSystem, eventBus: EventBus) {
        super('Player', scene);
        this.inputSystem = inputSystem;
        this.eventBus = eventBus;
    }
    
    /**
     * Override position getter - use explicit player position
     */
    public get position(): BABYLON.Vector3 {
        return this._position;
    }
    
    /**
     * Override position setter - update logical position only
     * Mesh position is synced in the update loop
     */
    public set position(value: BABYLON.Vector3) {
        this._position = value.clone();
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
        this._position = new BABYLON.Vector3(0, 2.0, 0);
        // Mesh position will be synced in first update()
        
        // Add material with player color (semi-transparent for debug)
        const material = new BABYLON.StandardMaterial(`${this.name}_Material`, this.scene);
        material.diffuseColor = new BABYLON.Color3(0.2, 0.6, 1.0); // Blue player
        material.specularColor = new BABYLON.Color3(0.3, 0.3, 0.3);
        material.alpha = 0.3; // Semi-transparent for debug visualization
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
        
        // Set initial visibility based on debug flag
        this.updateDebugLineVisibility();
        
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
        this.axisX.isPickable = false;
        this.axisX.checkCollisions = false;
        
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
        this.axisY.isPickable = false;
        this.axisY.checkCollisions = false;
        
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
        this.axisZ.isPickable = false;
        this.axisZ.checkCollisions = false;
        
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
        this.groundRayLine.isPickable = false;
        this.groundRayLine.checkCollisions = false;
        
        // Slope-adjusted forward direction - updatable
        this.slopeForwardLine = BABYLON.MeshBuilder.CreateLines(
            'slopeForward',
            {
                points: [origin, origin.add(new BABYLON.Vector3(axisLength, 0, 0))],
                updatable: true
            },
            this.scene
        );
        this.slopeForwardLine.color = new BABYLON.Color3(1, 0.4, 0.2); // Orange-red
        this.slopeForwardLine.alwaysSelectAsActiveMesh = true;
        this.slopeForwardLine.isPickable = false;
        this.slopeForwardLine.checkCollisions = false;
    }
    
    /**
     * Update visibility of debug lines based on global flag
     */
    private updateDebugLineVisibility(): void {
        const visible = SimplePlayer.debugVisualsEnabled;
        if (this.axisX) this.axisX.isVisible = visible;
        if (this.axisY) this.axisY.isVisible = visible;
        if (this.axisZ) this.axisZ.isVisible = visible;
        if (this.slopeForwardLine) this.slopeForwardLine.isVisible = visible;
        if (this.groundRayLine) this.groundRayLine.isVisible = visible;
    }
    
    /**
     * Check if player is grounded using raycast
     */
    private checkGrounded(): void {
        if (!this.mesh) return;
        
        // Cast ray from player position downwards
        const rayOrigin = this._position.clone();
        const rayDirection = new BABYLON.Vector3(0, -1, 0);
        const rayLength = (this.capsuleHeight / 2) + this.groundCheckDistance;
        
        const ray = new BABYLON.Ray(rayOrigin, rayDirection, rayLength);
        const hit = this.scene.pickWithRay(ray, (mesh) => {
            // Don't collide with self
            if (mesh === this.mesh) return false;
            // Also ignore the player's visualization meshes so ground checks never hit the character model
            if (this.visualization && this.visualization.isOwnedMesh(mesh)) return false;
            return true;
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
        // Account for increased vertical distance to the contact point on slopes (plane is angled)
        const angleRad = this.slopeAngle * (Math.PI / 180);
        const slopeFactor = 1 / Math.max(0.01, Math.cos(angleRad)); // Bigger factor on steeper slopes
        const slopeTolerance = 0.05; // Small buffer to avoid flicker near the limit
        const groundThreshold = baseThreshold * slopeFactor + slopeTolerance;
        
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
                // Yellow when we consider grounded (walkable)
                this.groundRayLine.color = new BABYLON.Color3(1, 1, 0);
            } else if (hit?.hit) {
                // Red for too-steep hits, otherwise orange for any detected surface
                this.groundRayLine.color = this.slopeAngle > this.maxWalkableSlope
                    ? new BABYLON.Color3(1, 0, 0)
                    : new BABYLON.Color3(1, 0.5, 0); // Orange when hit but not grounded
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
        
        // Sync mesh to logical position at start of frame
        this.mesh.position = this._position.clone();
        
        // Disable input when dead
        if (this.isDead) {
            return;
        }
        
        const input = this.inputSystem.getState();
        const movement = input.getMovementInput();
        const deltaTimeSec = deltaTime / 1000; // Convert ms to seconds
        
        // Check if grounded
        this.checkGrounded();
        
        let jumpedThisFrame = false;

        // Handle jump input - only allow one jump per key press
        if (input.isJumpPressed()) {
            if (this.isGrounded && !this.hasJumped) {
                this.currentVelocity.y = this.jumpSpeed;
                this.isGrounded = false; // Immediately mark as not grounded so gravity applies next frame
                this.hasJumped = true; // Mark that we've jumped
                jumpedThisFrame = true;
                Logger.debug(`Jump initiated! velocity.y = ${this.currentVelocity.y}`);
            }
        } else {
            // Reset jump flag when space is released
            this.hasJumped = false;
        }
        
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
            
            // If grounded on a slope, project movement onto slope plane for smooth traversal
            if (this.isGrounded && this.slopeAngle > 0.1) {
                // Project movement direction onto slope plane
                // This removes the component perpendicular to the slope
                moveDirection = moveDirection.subtract(
                    this.groundNormal.scale(BABYLON.Vector3.Dot(moveDirection, this.groundNormal))
                );
                
                // Renormalize after projection
                if (moveDirection.length() > 0.01) {
                    moveDirection.normalize();
                }
            }
            
            this.lastMoveDirection = moveDirection.clone();
            
            // Update player rotation based on movement direction
            this.updatePlayerOrientation(moveDirection);
        } else if (this.cameraController && input.getLookInput().length() > 0.05) {
            const facingDirection = this.cameraController.getForwardDirection().scale(-1);
            this.updatePlayerOrientation(facingDirection);
        } else {
            this.lastMoveDirection = BABYLON.Vector3.Zero();
        }
        
        // Apply gravity when not grounded
        if (!this.isGrounded) {
            if (!jumpedThisFrame) {
                this.currentVelocity.y += this.gravity * deltaTimeSec;
                if (this.currentVelocity.y > 5) {
                    Logger.debug(`In air: velocity.y = ${this.currentVelocity.y.toFixed(2)}, gravity applied = ${(this.gravity * deltaTimeSec).toFixed(2)}`);
                }
            }
        } else {
            // When grounded, only apply downward force if not jumping
            // Check if we just jumped (Y velocity is positive/upward)
            if (this.currentVelocity.y < 0.5) {
                // Not jumping, apply grounding forces
                if (movement.length() < 0.01) {
                    this.currentVelocity.y = -0.5; // Small constant downward velocity to stay grounded
                }
            }

            // If we've stopped moving, clear any leftover uphill velocity so we don't get dragged upward
            if (movement.length() < 0.05 && this.currentVelocity.y > 0) {
                this.currentVelocity.y = -0.5;
            }
            
            // Anti-slide logic for slopes (only if not jumping)
            if (this.currentVelocity.y < 0.5 && this.slopeAngle > 0.1 && this.slopeAngle <= this.maxWalkableSlope) {
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
        
        // Calculate velocity from move direction
        // On slopes, moveDirection is already slope-corrected and includes Y component
        if (this.isGrounded && this.slopeAngle > 0.1 && movement.length() > 0.01) {
            // Use full 3D slope-corrected direction when moving on slopes
            this.currentVelocity.x = moveDirection.x * currentSpeed;
            this.currentVelocity.y = moveDirection.y * currentSpeed;
            this.currentVelocity.z = moveDirection.z * currentSpeed;
        } else {
            // On flat ground or not moving, only set horizontal components
            this.currentVelocity.x = moveDirection.x * currentSpeed;
            this.currentVelocity.z = moveDirection.z * currentSpeed;
            // Y velocity is handled above (gravity or ground contact)
        }
        
        // Use moveWithCollisions for automatic collision response
        const velocity = this.currentVelocity.scale(deltaTimeSec);
        (this.mesh as BABYLON.Mesh).moveWithCollisions(velocity);
        
        // Update logical position from mesh after collision resolution
        this._position = this.mesh.position.clone();
        
        // Check for landing and apply fall damage
        this.checkFallDamage();
        
        // Store previous state for next frame
        this.previousVelocity.copyFrom(this.currentVelocity);
        this.previousGrounded = this.isGrounded;
        
        // Drive animations according to movement state (but not when dead)
        if (!this.isDead) {
            this.updateAnimationState(movement, input.isSprintPressed());
        }

        // Sync visualization with player position and orientation (if loaded)
        // Apply vertical offset: model origin is at bottom-center, player position is at mid-center
        if (this.visualization && this.visualization.isLoaded()) {
            const visualOffset = new BABYLON.Vector3(0, -this.capsuleHeight / 2, 0);
            this.visualization.setPosition(this._position.clone().add(visualOffset));
            this.visualization.setOrientation(this.mesh.rotation.y + this.visualizationYawOffset);
        }
        
        // Update debug line visibility
        this.updateDebugLineVisibility();
        
        // Update debug visualization
        this.updateOrientationAxes();
    }
    
    /**
     * Update orientation axes to reflect current rotation and player world position
     */
    private updateOrientationAxes(): void {
        if (!SimplePlayer.debugVisualsEnabled) return; // Skip if debug disabled
        if (!this.axisX || !this.axisY || !this.axisZ || !this.mesh) return;
        
        // Get player's current world position
        const playerWorldPos = this._position;
        
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
        
        // Update slope-adjusted forward direction
        if (this.slopeForwardLine) {
            // Project forward direction onto slope plane
            // Remove the component perpendicular to the slope
            const slopeAdjustedForward = forwardRotated.subtract(
                this.groundNormal.scale(BABYLON.Vector3.Dot(forwardRotated, this.groundNormal))
            ).normalize();
            
            const slopeForwardOuter = playerWorldPos.add(slopeAdjustedForward.scale(axisLength));
            
            this.slopeForwardLine = BABYLON.MeshBuilder.CreateLines(
                'slopeForward',
                { points: [playerWorldPos, slopeForwardOuter], instance: this.slopeForwardLine },
                this.scene
            );
        }
    }
    
    /**
     * Get current velocity for debugging
     */
    public getCurrentVelocity(): BABYLON.Vector3 {
        return this.currentVelocity;
    }    
    /**
     * Reset velocity to zero
     */
    public resetVelocity(): void {
        this.currentVelocity.set(0, 0, 0);
        this.previousVelocity.set(0, 0, 0);
    }    
    /**
     * Set the camera controller for camera-relative movement
     */
    public setCameraController(cameraController: CameraController): void {
        this.cameraController = cameraController;
    }
    
    /**
     * Attach and load player visualization (character model, animations, sounds)
     * This is optional and doesn't affect physics/movement
     * @param modelPath Path to the 3D model file
     * @param animationConfigs Animation configurations
     */
    public async loadVisualization(
        modelPath: string,
        animationConfigs: {[key: string]: any}
    ): Promise<void> {
        if (!this.visualization) {
            this.visualization = new PlayerVisualization(this.scene);
        }
        
        try {
            await this.visualization.load(modelPath, animationConfigs);
            // Sync initial position with vertical offset and rotation
            const visualOffset = new BABYLON.Vector3(0, -this.capsuleHeight / 2, 0);
            this.visualization.setPosition(this._position.clone().add(visualOffset));
            this.visualization.setOrientation(this.playerRotation);
            // Hide physics capsule when visualization is loaded
            if (this.mesh) {
                (this.mesh as BABYLON.Mesh).isVisible = false;
            }
            Logger.info('✅ Player visualization attached and loaded');
        } catch (error) {
            Logger.error(`Failed to load player visualization: ${error}`);
        }
    }
    
    /**
     * Get the visualization component (if loaded)
     */
    public getVisualization(): PlayerVisualization | undefined {
        return this.visualization;
    }
    
    /**
     * Show or hide the physics capsule mesh
     * Useful for debugging collision boundaries
     */
    public setPhysicsCapsuleVisible(visible: boolean): void {
        if (this.mesh) {
            (this.mesh as BABYLON.Mesh).isVisible = visible;
            Logger.info(`Physics capsule ${visible ? 'shown' : 'hidden'}`);
        }
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
     * Enable or disable debug visuals (axis lines, rays, etc.)
     */
    public static setDebugVisualsEnabled(enabled: boolean): void {
        SimplePlayer.debugVisualsEnabled = enabled;
        Logger.info(`Debug visuals ${enabled ? 'enabled' : 'disabled'}`);
    }
    
    /**
     * Get debug visuals enabled state
     */
    public static getDebugVisualsEnabled(): boolean {
        return SimplePlayer.debugVisualsEnabled;
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
        const rotationSpeed = 0.35;
        this.playerRotation = this.playerRotation + (targetRotation - this.playerRotation) * rotationSpeed;
        
        // Apply rotation to the mesh (only Y axis rotation)
        this.mesh.rotation.y = this.playerRotation;
    }

    /**
     * Selects the appropriate animation group based on movement/physics state
     */
    private updateAnimationState(movement: BABYLON.Vector2, isSprinting: boolean): void {
        if (!this.visualization || !this.visualization.isLoaded()) return;

        if (!this.isGrounded) {
            if (this.currentVelocity.y > 0.3) {
                this.visualization.play('jump');
            } else {
                this.visualization.play('fall');
            }
            return;
        }

        const horizontalVelocity = new BABYLON.Vector3(this.currentVelocity.x, 0, this.currentVelocity.z);
        const horizontalSpeed = horizontalVelocity.length();
        const movementIntent = movement.length() > 0.1;
        const isMoving = movementIntent || horizontalSpeed > 0.1;

        if (isMoving) {
            if (isSprinting) {
                this.visualization.play('sprint');
            } else if (horizontalSpeed > this.moveSpeed * 1.1) {
                this.visualization.play('run');
            } else {
                this.visualization.play('walk');
            }
        } else {
            this.visualization.play('idle');
        }
    }
    
    /**
     * Check for landing and calculate fall damage
     */
    private checkFallDamage(): void {
        if (this.isDead) return;
        
        // Detect landing: was airborne, now grounded
        const justLanded = !this.previousGrounded && this.isGrounded;
        
        if (justLanded) {
            // Get the fall velocity (absolute Y velocity from previous frame)
            const fallSpeed = Math.abs(this.previousVelocity.y);
            
            // Calculate damage if fall speed exceeds threshold
            if (fallSpeed > this.FALL_DAMAGE_THRESHOLD) {
                const excessSpeed = fallSpeed - this.FALL_DAMAGE_THRESHOLD;
                const damage = Math.floor(excessSpeed * this.FALL_DAMAGE_FACTOR);
                
                if (damage > 0) {
                    this.takeDamage(damage);
                    Logger.info(`💥 Fall damage: ${damage} HP (speed: ${fallSpeed.toFixed(1)} units/s)`);
                }
            }
        }
    }
    
    /**
     * Apply damage to player
     */
    private takeDamage(amount: number): void {
        if (this.isDead) return;
        
        this.health = Math.max(0, this.health - amount);
        this.eventBus.emit('player:health-changed', { 
            health: this.health, 
            maxHealth: this.MAX_HEALTH 
        });
        
        if (this.health <= 0) {
            this.die();
        }
    }
    
    /**
     * Handle player death
     */
    private die(): void {
        if (this.isDead) return;
        
        this.isDead = true;
        
        // Play death animation if visualization is loaded
        if (this.visualization && this.visualization.isLoaded()) {
            this.visualization.play('dieOnFall');
        }
        
        Logger.warn('💀 Player died');
        this.eventBus.emit('player:died', {});
    }
    
    /**
     * Reset player to full health and initial state
     */
    public resetHealth(): void {
        this.health = this.MAX_HEALTH;
        this.isDead = false;
        this.eventBus.emit('player:health-changed', { 
            health: this.health, 
            maxHealth: this.MAX_HEALTH 
        });
        Logger.info('❤️ Player health restored');
    }
    
    /**
     * Get current health value
     */
    public getHealth(): number {
        return this.health;
    }
    
    /**
     * Check if player is dead
     */
    public getIsDead(): boolean {
        return this.isDead;
    }
    
    /**
     * Dispose player and cleanup resources
     */
    public dispose(): void {
        // Dispose visualization
        if (this.visualization) {
            this.visualization.dispose();
            this.visualization = undefined;
        }
        
        // Dispose orientation axes
        if (this.axisX) this.axisX.dispose();
        if (this.axisY) this.axisY.dispose();
        if (this.axisZ) this.axisZ.dispose();
        if (this.slopeForwardLine) this.slopeForwardLine.dispose();
        if (this.groundRayLine) this.groundRayLine.dispose();
        
        super.dispose();
    }
}
