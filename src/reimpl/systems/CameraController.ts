import * as BABYLON from '@babylonjs/core';
import { Entity } from '../entities/Entity';
import { Environment } from '../core/Environment';
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
    distance?: number;          // Distance from target (radius)
    angularSensibilityX?: number;  // Horizontal rotation sensitivity
    angularSensibilityY?: number;  // Vertical rotation sensitivity
    upperBetaLimit?: number;    // Upper vertical limit (looking down)
    lowerBetaLimit?: number;    // Lower vertical limit (looking up)
}

/**
 * Camera controller - handles following targets and smooth camera movement
 * Uses ArcRotateCamera for intuitive third-person controls
 */
export class CameraController {
    private camera: BABYLON.ArcRotateCamera;
    private scene: BABYLON.Scene;
    private canvas: HTMLCanvasElement;
    private target?: Entity;
    private mode: CameraMode = CameraMode.THIRD_PERSON;
    private inputSystem: InputSystem;
    
    // Configuration
    private distance: number = 8;
    private angularSensibilityX: number = 1500;
    private angularSensibilityY: number = 1500;
    private upperBetaLimit: number = 1.5;  // ~97° (near horizon)
    private lowerBetaLimit: number = 0.1;  // slight restriction from looking straight up
    private mobileLookSpeed: number = 2.6;
    private isMobile: boolean;
    
    constructor(scene: BABYLON.Scene, canvas: HTMLCanvasElement, inputSystem: InputSystem, config?: CameraConfig) {
        this.scene = scene;
        this.canvas = canvas;
        this.inputSystem = inputSystem;
        this.isMobile = Environment.isMobile;
        
        // Apply config
        if (config) {
            this.distance = config.distance ?? this.distance;
            this.angularSensibilityX = config.angularSensibilityX ?? this.angularSensibilityX;
            this.angularSensibilityY = config.angularSensibilityY ?? this.angularSensibilityY;
            this.upperBetaLimit = config.upperBetaLimit ?? this.upperBetaLimit;
            this.lowerBetaLimit = config.lowerBetaLimit ?? this.lowerBetaLimit;
        }
        
        // Create ArcRotateCamera
        this.camera = new BABYLON.ArcRotateCamera(
            'MainCamera',
            -Math.PI / 2,  // alpha (horizontal rotation)
            Math.PI / 2,   // beta (vertical rotation)
            this.distance, // radius
            BABYLON.Vector3.Zero(),
            this.scene,
            true
        );
        
        // Configure camera
        if (!this.isMobile) {
            this.camera.attachControl(this.canvas, true);
        }
        this.camera.inputs.remove(this.camera.inputs.attached.keyboard);
        this.camera.inputs.remove(this.camera.inputs.attached.mousewheel);
        
        this.camera.angularSensibilityX = this.angularSensibilityX;
        this.camera.angularSensibilityY = this.angularSensibilityY;
        this.camera.upperBetaLimit = this.upperBetaLimit;
        this.camera.lowerBetaLimit = this.lowerBetaLimit;
        
        // Set as active camera
        this.scene.activeCamera = this.camera;
        
        Logger.info('Camera controller initialized with ArcRotateCamera');
    }

    /**
     * Set the entity to follow
     */
    public setTarget(entity: Entity): void {
        this.target = entity;
        // ArcRotateCamera will follow the mesh directly
        const mesh = entity.getMesh();
        if (mesh) {
            this.camera.lockedTarget = mesh;
        }
        Logger.info(`Camera now following: ${entity.name}`);
    }
    
    /**
     * Clear the follow target
     */
    public clearTarget(): void {
        this.target = undefined;
        this.camera.lockedTarget = null;
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
     * Update camera each frame - ArcRotateCamera handles rotation automatically
     */
    public update(deltaTime: number): void {
        if (!this.isMobile) {
            return;
        }

        const lookInput = this.inputSystem.getState().getLookInput();
        if (lookInput.lengthSquared() < 0.0001) {
            return;
        }

        const deltaSeconds = deltaTime / 1000;
        this.camera.alpha -= lookInput.x * this.mobileLookSpeed * deltaSeconds;
        this.camera.beta = BABYLON.Scalar.Clamp(
            this.camera.beta - lookInput.y * this.mobileLookSpeed * deltaSeconds,
            this.lowerBetaLimit,
            this.upperBetaLimit
        );
    }
    
    /**
     * Get the camera instance
     */
    public getCamera(): BABYLON.ArcRotateCamera {
        return this.camera;
    }
    
    /**
     * Set camera distance from target
     */
    public setDistance(distance: number): void {
        this.distance = distance;
        this.camera.radius = distance;
        Logger.debug(`Camera distance set to: ${this.distance}`);
    }
    
    /**
     * Get camera's alpha (horizontal rotation angle)
     */
    public getAlpha(): number {
        return this.camera.alpha;
    }
    
    /**
     * Get camera's beta (vertical rotation angle)
     */
    public getBeta(): number {
        return this.camera.beta;
    }
    
    /**
     * Get current camera forward direction (useful for relative movement)
     */
    public getForwardDirection(): BABYLON.Vector3 {
        // Inverted controls
        const alpha = this.camera.alpha;
        return new BABYLON.Vector3(Math.cos(alpha), 0, Math.sin(alpha)).normalize();
    }
    
    /**
     * Get current camera right direction
     */
    public getRightDirection(): BABYLON.Vector3 {
        // Inverted controls - right is 90° clockwise from forward
        const alpha = this.camera.alpha;
        return new BABYLON.Vector3(Math.sin(alpha), 0, -Math.cos(alpha)).normalize();
    }
    
    /**
     * Dispose camera
     */
    public dispose(): void {
        Logger.info('Disposing camera controller');
        this.camera.dispose();
    }
}
