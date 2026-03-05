import * as BABYLON from '@babylonjs/core';
import { Logger } from '../core/Logger';

/**
 * Base class for all game entities (players, NPCs, items, props, etc.)
 * Provides common functionality for scene objects with lifecycle management
 */
export abstract class Entity {
    protected mesh?: BABYLON.Mesh | BABYLON.TransformNode;
    protected scene: BABYLON.Scene;
    protected _isActive: boolean = true;
    protected _name: string;
    
    constructor(name: string, scene: BABYLON.Scene) {
        this._name = name;
        this.scene = scene;
        Logger.debug(`Entity created: ${name}`);
    }
    
    /**
     * Initialize the entity - called after construction
     * Override this to setup meshes, materials, etc.
     */
    public abstract init(): void;
    
    /**
     * Update the entity - called each frame
     * @param deltaTime Time since last frame in milliseconds
     */
    public abstract update(deltaTime: number): void;
    
    /**
     * Get entity name
     */
    public get name(): string {
        return this._name;
    }
    
    /**
     * Get position
     */
    public get position(): BABYLON.Vector3 {
        return this.mesh ? this.mesh.position : BABYLON.Vector3.Zero();
    }
    
    /**
     * Set position
     */
    public set position(value: BABYLON.Vector3) {
        if (this.mesh) {
            this.mesh.position = value;
        }
    }
    
    /**
     * Get rotation
     */
    public get rotation(): BABYLON.Vector3 {
        return this.mesh ? this.mesh.rotation : BABYLON.Vector3.Zero();
    }
    
    /**
     * Set rotation
     */
    public set rotation(value: BABYLON.Vector3) {
        if (this.mesh) {
            this.mesh.rotation = value;
        }
    }
    
    /**
     * Get scaling
     */
    public get scaling(): BABYLON.Vector3 {
        return this.mesh ? this.mesh.scaling : BABYLON.Vector3.One();
    }
    
    /**
     * Set scaling
     */
    public set scaling(value: BABYLON.Vector3) {
        if (this.mesh) {
            this.mesh.scaling = value;
        }
    }
    
    /**
     * Check if entity is active
     */
    public get isActive(): boolean {
        return this._isActive;
    }
    
    /**
     * Set entity active state
     */
    public setActive(active: boolean): void {
        this._isActive = active;
        if (this.mesh) {
            this.mesh.setEnabled(active);
        }
        Logger.debug(`Entity ${this._name} active state: ${active}`);
    }
    
    /**
     * Get the root mesh/transform node
     */
    public getMesh(): BABYLON.Mesh | BABYLON.TransformNode | undefined {
        return this.mesh;
    }
    
    /**
     * Dispose and cleanup entity
     */
    public dispose(): void {
        Logger.debug(`Disposing entity: ${this._name}`);
        if (this.mesh) {
            this.mesh.dispose();
            this.mesh = undefined;
        }
    }
}
