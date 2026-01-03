import * as BABYLON from '@babylonjs/core';
import { PhysicsManager } from '../systems/PhysicsManager';
import { Logger } from '../core/Logger';

/**
 * TestLevel - Creates test geometry for physics testing
 * Includes cubes, ramps, and various obstacles
 */
export class TestLevel {
    private scene: BABYLON.Scene;
    private physicsManager: PhysicsManager;
    private meshes: BABYLON.Mesh[] = [];
    
    constructor(scene: BABYLON.Scene, physicsManager: PhysicsManager) {
        this.scene = scene;
        this.physicsManager = physicsManager;
    }
    
    /**
     * Create all test level geometry
     */
    public create(): void {
        Logger.info('Creating test level...');
        
        // Create some scattered boxes
        this.createTestBoxes();
        
        // Create ramps of different angles
        this.createRamps();
        
        // Create a step platform
        this.createStepPlatform();
        
        Logger.info(`✅ Test level created with ${this.meshes.length} objects`);
    }
    
    /**
     * Create scattered test boxes
     */
    private createTestBoxes(): void {
        const boxPositions = [
            new BABYLON.Vector3(5, 1, 5),
            new BABYLON.Vector3(-5, 1, 5),
            new BABYLON.Vector3(8, 1, -3),
            new BABYLON.Vector3(-6, 1, -6)
        ];
        
        boxPositions.forEach((pos, index) => {
            const box = BABYLON.MeshBuilder.CreateBox(
                `TestBox_${index}`,
                { size: 2 },
                this.scene
            );
            
            box.position = pos;
            
            // Enable collision detection for moveWithCollisions
            box.checkCollisions = true;
            
            // Add colorful material
            const material = new BABYLON.StandardMaterial(`BoxMat_${index}`, this.scene);
            const hue = (index * 60) % 360;
            material.diffuseColor = BABYLON.Color3.FromHSV(hue, 0.7, 0.8);
            material.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
            box.material = material;
            
            // Add physics - static boxes
            this.physicsManager.createBody(
                box,
                'static',
                {
                    friction: 0.5,
                    restitution: 0.0,
                    shape: 'box'
                }
            );
            
            this.meshes.push(box);
        });
        
        Logger.debug(`Created ${boxPositions.length} test boxes`);
    }
    
    /**
     * Create ramps with different angles
     */
    private createRamps(): void {
        // Gentle ramp (20 degrees) - walkable with maximum grip
        this.createRamp(
            'GentleRamp',
            new BABYLON.Vector3(-10, 0, 0),
            20,
            10,
            new BABYLON.Color3(0.3, 0.8, 0.3), // Green = walkable
            2.0 // Maximum friction - no slipping!
        );
        
        // Medium ramp (35 degrees) - walkable but harder
        this.createRamp(
            'MediumRamp',
            new BABYLON.Vector3(0, 0, -10),
            35,
            10,
            new BABYLON.Color3(0.8, 0.8, 0.3) // Yellow = challenging
        );
        
        // Steep ramp (50 degrees) - too steep, should slide - MOVED TO SPAWN
        this.createRamp(
            'SteepRamp',
            new BABYLON.Vector3(0, 0, 5), // Right in front of spawn!
            50,
            10,
            new BABYLON.Color3(0.8, 0.3, 0.3), // Red = too steep
            0.00001 // Almost no friction
        );
        
        // Slippery gentle ramp (20 degrees but low friction)
        this.createRamp(
            'SlipperyRamp',
            new BABYLON.Vector3(0, 0, 10),
            20,
            10,
            new BABYLON.Color3(0.4, 0.6, 0.9), // Blue = icy
            0.05 // Very low friction
        );
    }
    
    /**
     * Create a single ramp
     */
    private createRamp(
        name: string,
        position: BABYLON.Vector3,
        angleDegrees: number,
        length: number,
        color: BABYLON.Color3,
        friction: number = 0.5
    ): void {
        const angleRadians = angleDegrees * (Math.PI / 180);
        const height = length * Math.sin(angleRadians);
        const width = 4;
        
        const ramp = BABYLON.MeshBuilder.CreateBox(
            name,
            { width, height: 0.5, depth: length },
            this.scene
        );
        
        // Position and rotate
        ramp.position = position.clone();
        ramp.position.y = height / 2;
        ramp.rotation.x = -angleRadians;
        
        // Enable collision detection for moveWithCollisions
        ramp.checkCollisions = true;
        
        // Material
        const material = new BABYLON.StandardMaterial(`${name}_Mat`, this.scene);
        material.diffuseColor = color;
        material.specularColor = new BABYLON.Color3(0.3, 0.3, 0.3);
        ramp.material = material;
        
        // Physics
        this.physicsManager.createBody(
            ramp,
            'static',
            {
                friction,
                restitution: 0.0,
                shape: 'box'
            }
        );
        
        // Add label text
        const frictionLabel = friction >= 1.5 ? '(Max Grip!)' : (friction < 0.1 ? '(Slippery!)' : '');
        this.createLabel(
            `${name}\n${angleDegrees}° ${frictionLabel}`,
            position.add(new BABYLON.Vector3(0, height + 2, 0))
        );
        
        this.meshes.push(ramp);
        Logger.debug(`Created ramp: ${name} at ${angleDegrees}° (friction: ${friction})`);
    }
    
    /**
     * Create step platform for testing stairs
     */
    private createStepPlatform(): void {
        const stepCount = 5;
        const stepWidth = 3;
        const stepDepth = 1;
        const stepHeight = 0.25;
        
        for (let i = 0; i < stepCount; i++) {
            const step = BABYLON.MeshBuilder.CreateBox(
                `Step_${i}`,
                { width: stepWidth, height: stepHeight, depth: stepDepth },
                this.scene
            );
            
            step.position = new BABYLON.Vector3(
                15,
                stepHeight / 2 + (i * stepHeight),
                -5 + (i * stepDepth)
            );
            
            // Enable collision detection for moveWithCollisions
            step.checkCollisions = true;
            
            // Material
            const material = new BABYLON.StandardMaterial(`StepMat_${i}`, this.scene);
            material.diffuseColor = new BABYLON.Color3(0.6, 0.5, 0.4);
            step.material = material;
            
            // Physics - very slippery stairs!
            this.physicsManager.createBody(
                step,
                'static',
                {
                    friction: 0.01, // Super slippery!
                    restitution: 0.0,
                    shape: 'box'
                }
            );
            
            this.meshes.push(step);
        }
        
        Logger.debug(`Created ${stepCount} steps`);
    }
    
    /**
     * Create a text label using a simple plane
     */
    private createLabel(text: string, position: BABYLON.Vector3): void {
        const plane = BABYLON.MeshBuilder.CreatePlane(
            `Label_${text}`,
            { width: 4, height: 1 },
            this.scene
        );
        
        plane.position = position;
        plane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
        
        // Create dynamic texture for text
        const texture = new BABYLON.DynamicTexture(
            `LabelTexture_${text}`,
            { width: 512, height: 128 },
            this.scene,
            false
        );
        
        texture.drawText(
            text,
            null,
            null,
            'bold 36px Arial',
            'white',
            'transparent',
            true,
            true
        );
        
        const material = new BABYLON.StandardMaterial(`LabelMat_${text}`, this.scene);
        material.diffuseTexture = texture;
        material.emissiveColor = new BABYLON.Color3(1, 1, 1);
        material.disableLighting = true;
        material.backFaceCulling = false;
        
        plane.material = material;
        this.meshes.push(plane);
    }
    
    /**
     * Dispose all level meshes
     */
    public dispose(): void {
        this.meshes.forEach(mesh => mesh.dispose());
        this.meshes = [];
        Logger.info('Test level disposed');
    }
}
