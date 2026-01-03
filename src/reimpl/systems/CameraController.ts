import * as BABYLON from '@babylonjs/core';
import { Entity } from '../entities/Entity';
import { Logger } from '../core/Logger';
import { InputSystem } from './InputSystem';

/**
 * Camera controller modes
 */
export enum CameraMode {
    THIRD_PERSON = 'third-person',
    FIRST_PERSON = 'first-person',
    FREE = 'free'
}

/**
 * Configuration for camera behavior
 */
export interface CameraConfig {
    distance?: number;          // Distance from target (third-person)
    height?: number;            // Height above target
    rotationSpeed?: number;     // Mouse rotation speed
    smoothing?: number;         // Camera smoothing (0-1, higher = smoother)
    minDistance?: number;       // Minimum zoom distance
    maxDistance?: number;       // Maximum zoom distance
    minPitch?: number;          // Minimum pitch angle (looking down, negative)
    maxPitch?: number;          // Maximum pitch angle (looking up, positive)
}

/**
 * Camera controller - handles following targets and smooth camera movement
 * Uses FreeCamera approach similar to BabylonJS character controller example
 */
export class CameraController {
    private camera: BABYLON.FreeCamera;
    private scene: BABYLON.Scene;
    private canvas: HTMLCanvasElement;
    private target?: Entity;
    private mode: CameraMode = CameraMode.THIRD_PERSON;
    private inputSystem: InputSystem;
    
    // Configuration
    private distance: number = 10;
    private height: number = 5;
    private rotationSpeed: number = 0.005;
    private smoothing: number = 0.1;
    private minDistance: number = 3;
    private maxDistance: number = 30;
    private minPitch: number = -Math.PI / 10; // -60 degrees (steep downward)
    private maxPitch: number = Math.PI / 2.5;  // +15 degrees (slight upward)
    
    // Smoothing
    private targetPosition: BABYLON.Vector3 = BABYLON.Vector3.Zero();
    private azimuth: number = 0; // Camera rotation angle around target (horizontal)
    private pitch: number = 0;    // Camera pitch angle (vertical, + is up, - is down)
    
    constructor(scene: BABYLON.Scene, canvas: HTMLCanvasElement, inputSystem: InputSystem, config?: CameraConfig) {
        this.scene = scene;
        this.canvas = canvas;
        this.inputSystem = inputSystem;
        
        // Apply config
        if (config) {
            this.distance = config.distance ?? this.distance;
            this.height = config.height ?? this.height;
            this.rotationSpeed = config.rotationSpeed ?? this.rotationSpeed;
            this.smoothing = config.smoothing ?? this.smoothing;
            this.minDistance = config.minDistance ?? this.minDistance;
            this.maxDistance = config.maxDistance ?? this.maxDistance;
            this.minPitch = config.minPitch ?? this.minPitch;
            this.maxPitch = config.maxPitch ?? this.maxPitch;
        }
        
        // Create free camera
        this.camera = new BABYLON.FreeCamera(
            'MainCamera',
            new BABYLON.Vector3(0, this.height, -this.distance),
            this.scene
        );
        
        // Initialize azimuth based on initial camera position
        this.azimuth = Math.PI; // Start behind the player (looking forward)
        
        // Set as active camera
        this.scene.activeCamera = this.camera;
        
        Logger.info('Camera controller initialized with pointer lock support');
    }

    /**
     * Set the entity to follow
     */
    public setTarget(entity: Entity): void {
        this.target = entity;
        this.targetPosition = entity.position.clone();
        this.camera.setTarget(this.targetPosition);
        Logger.info(`Camera now following: ${entity.name}`);
    }
    
    /**
     * Clear the follow target
     */
    public clearTarget(): void {
        this.target = undefined;
        Logger.debug('Camera target cleared');
    }
    
    /**
     * Set camera mode
     */
    public setMode(mode: CameraMode): void {
        this.mode = mode;
        Logger.info(`Camera mode set to: ${mode}`);
    }
    
    /**
     * Update camera each frame - smoothly follow target
     */
    public update(deltaTime: number): void {
        if (!this.target) return;

        // Update rotation from mouse delta (pointer lock)
        const mouseDelta = this.inputSystem.getState().getMouseDelta();
        this.azimuth += mouseDelta.x * this.rotationSpeed;
        this.pitch -= mouseDelta.y * this.rotationSpeed; // Negative because mouse down = look down
        
        // Clamp pitch within limits
        this.pitch = BABYLON.Scalar.Clamp(this.pitch, this.minPitch, this.maxPitch);
        
        const targetPos = this.target.position.clone();

        // Smoothly lerp target position
        this.targetPosition = BABYLON.Vector3.Lerp(
            this.targetPosition,
            targetPos,
            this.smoothing
        );

        // Calculate camera position using spherical coordinates
        // Orbit around the player's center of mass (their position)
        const orbitCenter = this.targetPosition.clone();
        
        // Calculate camera position relative to orbit center using spherical coordinates
        const horizontalDistance = this.distance * Math.cos(this.pitch);
        const cameraX = orbitCenter.x + Math.sin(this.azimuth) * horizontalDistance;
        const cameraZ = orbitCenter.z + Math.cos(this.azimuth) * horizontalDistance;
        const cameraY = orbitCenter.y + this.distance * Math.sin(this.pitch);
        
        // Set camera position (no lerp on position to avoid lag)
        this.camera.position.set(cameraX, cameraY, cameraZ);
        
        // Always look at the orbit center (player's center of mass)
        this.camera.setTarget(orbitCenter);
    }
    
    /**
     * Get the camera instance
     */
    public getCamera(): BABYLON.FreeCamera {
        return this.camera;
    }
    
    /**
     * Set camera distance from target
     */
    public setDistance(distance: number): void {
        this.distance = BABYLON.Scalar.Clamp(distance, this.minDistance, this.maxDistance);
        Logger.debug(`Camera distance set to: ${this.distance}`);
    }
    
    /**
     * Set camera height above target
     */
    public setHeight(height: number): void {
        this.height = height;
        Logger.debug(`Camera height set to: ${this.height}`);
    }
    
    /**
     * Set camera smoothing
     */
    public setSmoothing(smoothing: number): void {
        this.smoothing = BABYLON.Scalar.Clamp(smoothing, 0, 1);
        Logger.debug(`Camera smoothing set to: ${this.smoothing}`);
    }
    
    /**
     * Get current camera forward direction (useful for relative movement)
     */
    public getForwardDirection(): BABYLON.Vector3 {
        // Use azimuth to calculate forward direction
        return new BABYLON.Vector3(Math.sin(this.azimuth), 0, Math.cos(this.azimuth)).normalize();
    }
    
    /**
     * Get current camera right direction
     */
    public getRightDirection(): BABYLON.Vector3 {
        // Right is perpendicular to forward
        return new BABYLON.Vector3(Math.cos(this.azimuth), 0, -Math.sin(this.azimuth)).normalize();
    }
    
    /**
     * Dispose camera
     */
    public dispose(): void {
        Logger.info('Disposing camera controller');
        this.camera.dispose();
    }
}
