import * as BABYLON from "@babylonjs/core";
import "@babylonjs/loaders";
import { Logger } from '../core/Logger';

/**
 * Animation properties configuration
 */
interface AnimationConfig {
    loop: boolean;
    speed: number;
    from?: number;
    to?: number;
    soundfile?: string;
}

/**
 * PlayerVisualization component
 * Manages character model loading, animations, and sounds
 * Decoupled from physics - only handles visual representation
 */
export class PlayerVisualization {
    private mesh?: BABYLON.AbstractMesh;
    private scene: BABYLON.Scene;
    private animations: Map<string, BABYLON.AnimationGroup> = new Map();
    private animationConfigs: Map<string, AnimationConfig> = new Map();
    private sounds: Map<string, BABYLON.Sound> = new Map();
    private ownedMeshIds: Set<number> = new Set();
    private meshLoaded: boolean = false;
    private soundsLoaded: boolean = false;
    private currentAnimation?: string;
    
    constructor(scene: BABYLON.Scene) {
        this.scene = scene;
    }
    
    /**
     * Load character model with animations and sounds
     * @param modelPath Path to the model file
     * @param animationConfigs Named animation configurations
     * @returns Promise that resolves when loading is complete
     */
    public async load(
        modelPath: string,
        animationConfigs: {[key: string]: AnimationConfig}
    ): Promise<void> {
        Logger.info(`🎨 Loading player visualization from ${modelPath}`);
        
        // Store animation configs
        Object.entries(animationConfigs).forEach(([name, config]) => {
            this.animationConfigs.set(name, config);
        });
        
        // Load model and animations
        await this.loadModel(modelPath);
        
        // Load sounds if any
        await this.loadSounds(animationConfigs);
        
        Logger.info('✅ Player visualization loaded');
    }
    
    /**
     * Load the 3D model and extract animations
     */
    private async loadModel(modelPath: string): Promise<void> {
        try {
            // Extract directory and filename from path
            const lastSlash = modelPath.lastIndexOf('/');
            const rootUrl = lastSlash >= 0 ? modelPath.substring(0, lastSlash + 1) : './';
            const filename = lastSlash >= 0 ? modelPath.substring(lastSlash + 1) : modelPath;
            
            Logger.info(`🔄 Loading model from: ${rootUrl}${filename}`);
            
            // Load model using SceneLoader
            const result = await BABYLON.SceneLoader.ImportMeshAsync(
                null,
                rootUrl,
                filename,
                this.scene
            );
            
            Logger.info(`✅ Model loaded: ${result.meshes.length} meshes`);
            
            // Get the root mesh
            if (result.meshes.length > 0) {
                this.mesh = result.meshes[0];
                this.mesh.rotation = BABYLON.Vector3.Zero();
                
                // Ensure all meshes are visible but never interfere with gameplay queries.
                // Visualization must not affect ground checks or collision-based movement.
                result.meshes.forEach((mesh, index) => {
                    mesh.isVisible = true;
                    mesh.isPickable = false;
                    mesh.checkCollisions = false;
                    this.ownedMeshIds.add(mesh.uniqueId);
                    Logger.debug(`  Mesh ${index}: ${mesh.name} (visible: ${mesh.isVisible})`);
                });
                
                // Extract animation groups and stop any automatic playback
                result.animationGroups.forEach((aniGroup) => {
                    this.animations.set(aniGroup.name, aniGroup);
                    aniGroup.stop();
                    aniGroup.reset();
                    Logger.debug(`  Animation: ${aniGroup.name}`);
                });
                
                this.meshLoaded = true;
                Logger.info(`✅ Mesh hierarchy loaded with ${this.animations.size} animations`);
            } else {
                throw new Error('No meshes found in model');
            }
        } catch (error) {
            Logger.error(`❌ Failed to load model: ${error}`);
            throw error;
        }
    }
    
    /**
     * Load animation sounds
     */
    private async loadSounds(animationConfigs: {[key: string]: AnimationConfig}): Promise<void> {
        const soundPromises: Promise<void>[] = [];
        
        Object.entries(animationConfigs).forEach(([aniName, config]) => {
            if (config.soundfile) {
                const promise = new Promise<void>((resolve, reject) => {
                    try {
                        const soundName = `${aniName}_sound`;
                        const sound = new BABYLON.Sound(
                            soundName,
                            config.soundfile!,
                            this.scene,
                            () => {
                                Logger.debug(`  Sound loaded: ${soundName}`);
                                resolve();
                            },
                            { autoplay: false }
                        );
                        this.sounds.set(soundName, sound);
                    } catch (error) {
                        Logger.warn(`Failed to load sound for ${aniName}: ${error}`);
                        resolve(); // Don't fail the entire load if a sound fails
                    }
                });
                soundPromises.push(promise);
            }
        });
        
        if (soundPromises.length > 0) {
            await Promise.all(soundPromises);
            Logger.debug(`  Loaded ${soundPromises.length} sounds`);
        }
        
        this.soundsLoaded = true;
    }
    
    /**
     * Check if an animation is currently playing
     */
    public isPlaying(animationName: string): boolean {
        const animation = this.animations.get(animationName);
        return animation?.isPlaying ?? false;
    }
    
    /**
     * Play a named animation
     * Automatically stops other animations and plays associated sound
     */
    public play(animationName: string): void {
        if (!this.meshLoaded || !this.animations.has(animationName)) {
            Logger.warn(`Cannot play animation "${animationName}" - not loaded`);
            return;
        }
        
        // Don't restart if already playing
        if (this.isPlaying(animationName)) {
            return;
        }
        
        // Stop all other animations
        this.animations.forEach((animation) => {
            animation.stop();
        });
        
        // Get animation and config
        const animation = this.animations.get(animationName)!;
        const config = this.animationConfigs.get(animationName);
        
        if (config) {
            // Start animation with config (frames optional)
            animation.start(
                config.loop,
                config.speed,
                config.from,
                config.to,
                false
            );
            this.currentAnimation = animationName;
            
            // Play associated sound if available
            const soundName = `${animationName}_sound`;
            if (this.sounds.has(soundName)) {
                this.playSound(soundName);
            }
        } else {
            // Play with defaults
            animation.start(true, 1.0);
            this.currentAnimation = animationName;
        }
    }
    
    /**
     * Stop current animation
     */
    public stop(): void {
        this.animations.forEach((animation) => {
            animation.stop();
        });
        this.stopAllSounds();
        this.currentAnimation = undefined;
    }
    
    /**
     * Play a named sound (stops other sounds first)
     */
    public playSound(soundName: string): void {
        this.stopAllSounds();
        
        const sound = this.sounds.get(soundName);
        if (sound) {
            sound.play();
        } else {
            Logger.warn(`Sound "${soundName}" not found`);
        }
    }
    
    /**
     * Stop all sounds
     */
    private stopAllSounds(): void {
        this.sounds.forEach((sound) => {
            sound.stop();
        });
    }
    
    /**
     * Get current animation name
     */
    public getCurrentAnimation(): string | undefined {
        return this.currentAnimation;
    }
    
    /**
     * Set position of the visual mesh
     * (Decoupled from physics - call this to sync with physics position)
     */
    public setPosition(position: BABYLON.Vector3): void {
        if (this.mesh) {
            this.mesh.position = position.clone();
        }
    }
    
    /**
     * Set rotation of the visual mesh
     */
    public setRotation(rotation: BABYLON.Vector3): void {
        if (this.mesh) {
            this.mesh.rotation = rotation.clone();
        }
    }
    
    /**
     * Set orientation (Y-axis rotation only)
     * @param azimuth Rotation angle in radians
     */
    public setOrientation(azimuth: number): void {
        if (this.mesh) {
            this.mesh.rotation.y = azimuth;
        }
    }
    
    /**
     * Get the root mesh
     */
    public getMesh(): BABYLON.AbstractMesh | undefined {
        return this.mesh;
    }

    /**
     * Returns true if the given mesh belongs to this visualization.
     * Useful to exclude the player model from raycasts/picking.
     */
    public isOwnedMesh(mesh: BABYLON.AbstractMesh): boolean {
        return this.ownedMeshIds.has(mesh.uniqueId);
    }
    
    /**
     * Check if fully loaded (mesh and sounds)
     */
    public isLoaded(): boolean {
        return this.meshLoaded && this.soundsLoaded;
    }
    
    /**
     * Get available animation names
     */
    public getAnimationNames(): string[] {
        return Array.from(this.animations.keys());
    }
    
    /**
     * Clean up resources
     */
    public dispose(): void {
        Logger.info('🗑️ Disposing player visualization');
        
        // Stop and dispose animations
        this.animations.forEach((animation) => {
            animation.stop();
            animation.dispose();
        });
        this.animations.clear();
        
        // Dispose sounds
        this.sounds.forEach((sound) => {
            sound.stop();
            sound.dispose();
        });
        this.sounds.clear();
        
        // Dispose mesh
        if (this.mesh) {
            this.mesh.dispose();
            this.mesh = undefined;
        }

        this.ownedMeshIds.clear();
        
        this.meshLoaded = false;
        this.soundsLoaded = false;
        this.currentAnimation = undefined;
    }
}
