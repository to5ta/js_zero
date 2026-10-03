import * as BABYLON from '@babylonjs/core';
import HavokPhysics from '@babylonjs/havok';
import { Logger } from '../core/Logger';

/**
 * PhysicsManager - Handles physics engine initialization and configuration
 * Uses Havok physics for high-performance collision detection and simulation
 */
export class PhysicsManager {
    private scene: BABYLON.Scene;
    private physicsPlugin?: BABYLON.HavokPlugin;
    private isInitialized: boolean = false;
    
    // Physics configuration
    private static readonly GRAVITY = new BABYLON.Vector3(0, -9.81, 0);
    
    constructor(scene: BABYLON.Scene) {
        this.scene = scene;
    }
    
    /**
     * Initialize Havok physics engine
     * Must be called before any physics operations
     */
    public async init(): Promise<void> {
        if (this.isInitialized) {
            Logger.warn('Physics already initialized');
            return;
        }
        
        try {
            Logger.info('Initializing Havok physics...');
            
            // Initialize Havok WASM module
            const havokInstance = await HavokPhysics();
            
            // Create Havok plugin
            this.physicsPlugin = new BABYLON.HavokPlugin(true, havokInstance);
            
            // Enable physics in scene
            this.scene.enablePhysics(PhysicsManager.GRAVITY, this.physicsPlugin);
            
            this.isInitialized = true;
            Logger.info('✅ Havok physics initialized successfully');
        } catch (error) {
            Logger.error('Failed to initialize physics:', error);
            throw error;
        }
    }
    
    /**
     * Create a physics body for a mesh
     */
    public createBody(
        mesh: BABYLON.Mesh,
        type: 'static' | 'dynamic' | 'kinematic',
        options: {
            mass?: number;
            restitution?: number;
            friction?: number;
            shape?: 'box' | 'sphere' | 'capsule' | 'mesh';
        } = {}
    ): BABYLON.PhysicsBody {
        if (!this.isInitialized) {
            throw new Error('Physics not initialized. Call init() first.');
        }
        
        // Default options
        const mass = options.mass ?? (type === 'static' ? 0 : 1);
        const restitution = options.restitution ?? 0.1;
        const friction = options.friction ?? 0.5;
        
        // Determine motion type
        let motionType: BABYLON.PhysicsMotionType;
        switch (type) {
            case 'static':
                motionType = BABYLON.PhysicsMotionType.STATIC;
                break;
            case 'dynamic':
                motionType = BABYLON.PhysicsMotionType.DYNAMIC;
                break;
            case 'kinematic':
                motionType = BABYLON.PhysicsMotionType.ANIMATED;
                break;
        }
        
        // Create physics body
        const body = new BABYLON.PhysicsBody(
            mesh,
            motionType,
            false, // Don't start disabled
            this.scene
        );
        
        // Set mass properties
        body.setMassProperties({ mass });
        
        // Create shape based on type
        let shape: BABYLON.PhysicsShape;
        
        switch (options.shape) {
            case 'sphere':
                const sphereRadius = mesh.getBoundingInfo().boundingSphere.radius;
                shape = new BABYLON.PhysicsShapeSphere(
                    BABYLON.Vector3.Zero(),
                    sphereRadius,
                    this.scene
                );
                break;
                
            case 'capsule':
                // For capsule, we need height and radius
                const boundingBox = mesh.getBoundingInfo().boundingBox;
                const height = boundingBox.maximum.y - boundingBox.minimum.y;
                const radius = Math.max(
                    boundingBox.maximum.x - boundingBox.minimum.x,
                    boundingBox.maximum.z - boundingBox.minimum.z
                ) / 2;
                
                shape = new BABYLON.PhysicsShapeCapsule(
                    new BABYLON.Vector3(0, -height / 2, 0),
                    new BABYLON.Vector3(0, height / 2, 0),
                    radius,
                    this.scene
                );
                break;
                
            case 'mesh':
                // Use mesh shape for complex geometry (expensive, use for static only)
                shape = new BABYLON.PhysicsShapeMesh(
                    mesh,
                    this.scene
                );
                break;
                
            case 'box':
            default:
                // Default to box shape
                const extents = mesh.getBoundingInfo().boundingBox.extendSize;
                shape = new BABYLON.PhysicsShapeBox(
                    BABYLON.Vector3.Zero(),
                    BABYLON.Quaternion.Identity(),
                    extents.scale(2), // extendSize is half-size
                    this.scene
                );
                break;
        }
        
        // Set material properties
        shape.material = {
            friction,
            restitution
        };
        
        // Attach shape to body
        body.shape = shape;
        
        Logger.debug(
            `Physics body created: ${type} ${options.shape || 'box'} ` +
            `(mass: ${mass}, friction: ${friction}, restitution: ${restitution})`
        );
        
        return body;
    }
    
    /**
     * Raycast from origin in direction
     */
    public raycast(
        origin: BABYLON.Vector3,
        direction: BABYLON.Vector3,
        maxDistance: number = 1000
    ): BABYLON.PhysicsRaycastResult {
        if (!this.isInitialized || !this.physicsPlugin) {
            throw new Error('Physics not initialized');
        }
        
        const endPoint = origin.add(direction.scale(maxDistance));
        const raycastResult = new BABYLON.PhysicsRaycastResult();
        this.physicsPlugin.raycast(origin, endPoint, raycastResult);
        return raycastResult;
    }
    
    /**
     * Check if physics is initialized
     */
    public get initialized(): boolean {
        return this.isInitialized;
    }
    
    /**
     * Get the physics plugin
     */
    public getPlugin(): BABYLON.HavokPlugin | undefined {
        return this.physicsPlugin;
    }
    
    /**
     * Set gravity
     */
    public setGravity(gravity: BABYLON.Vector3): void {
        if (this.isInitialized && this.scene.physicsEnabled) {
            this.scene.gravity = gravity;
            Logger.debug(`Gravity set to (${gravity.x}, ${gravity.y}, ${gravity.z})`);
        }
    }
    
    /**
     * Dispose physics manager
     */
    public dispose(): void {
        if (this.physicsPlugin) {
            this.scene.disablePhysicsEngine();
            this.physicsPlugin = undefined;
            this.isInitialized = false;
            Logger.info('Physics manager disposed');
        }
    }
}
