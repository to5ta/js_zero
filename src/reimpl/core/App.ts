import * as BABYLON from '@babylonjs/core';
import * as BABYLONGUI from '@babylonjs/gui';
import { EventBus } from './EventBus';
import { Environment } from './Environment';
import { Logger } from './Logger';
import { LoadingScreen } from '../ui/LoadingScreen';
import { InputDebugUI } from '../ui/InputDebugUI';
import { PlayerDebugUI } from '../ui/PlayerDebugUI';
import { InputSystem } from '../systems/InputSystem';
import { CameraController } from '../systems/CameraController';
import { PhysicsManager } from '../systems/PhysicsManager';
import { EntityManager } from '../entities/EntityManager';
import { SimplePlayer } from '../entities/SimplePlayer';
import { TestLevel } from '../entities/TestLevel';
import Stats from 'stats-js';

/**
 * Main application class - handles BabylonJS engine and lifecycle
 */
export class App {
    private engine: BABYLON.Engine;
    private scene: BABYLON.Scene;
    private eventBus: EventBus;
    private loadingScreen: LoadingScreen;
    private isRunning: boolean = false;
    private stats: Stats;
    private entityManager: EntityManager;
    private cameraController: CameraController;
    private inputSystem: InputSystem;
    private physicsManager: PhysicsManager;
    private inputDebugUI?: InputDebugUI;
    private playerDebugUI?: PlayerDebugUI;
    private sharedDebugTexture?: BABYLONGUI.AdvancedDynamicTexture;
    private player?: SimplePlayer;
    private testLevel?: TestLevel;
    
    constructor() {
        Logger.info('Initializing application...');
        
        // Initialize environment
        Environment.init();
        
        // Create event bus
        this.eventBus = new EventBus();
        
        // Create BabylonJS engine
        this.engine = new BABYLON.Engine(Environment.canvas, true, {
            preserveDrawingBuffer: true,
            stencil: true
        });
        
        Logger.info('BabylonJS Engine created');
        
        // Create scene
        this.scene = new BABYLON.Scene(this.engine);
        this.scene.clearColor = new BABYLON.Color4(0.1, 0.1, 0.15, 1);
        
        // Add basic light
        const light = new BABYLON.HemisphericLight(
            'light', 
            new BABYLON.Vector3(0, 1, 0), 
            this.scene
        );
        light.intensity = 0.7;
        
        // Create ground with grid
        this.createGround();
        
        Logger.debug('Scene setup complete with light and ground');
        
        // Setup custom loading screen
        this.loadingScreen = new LoadingScreen(this.eventBus);
        this.engine.loadingScreen = this.loadingScreen;
        
        // Setup FPS counter
        this.stats = new Stats();
        this.stats.showPanel(0); // 0: fps, 1: ms, 2: mb
        document.body.appendChild(this.stats.dom);
        Logger.debug('FPS counter added');
        
        // Initialize input system
        this.inputSystem = new InputSystem(Environment.canvas);
        
        // Initialize physics manager
        this.physicsManager = new PhysicsManager(this.scene);
        
        // Initialize camera controller
        this.cameraController = new CameraController(this.scene, Environment.canvas, {
            distance: 8,
            height: 3,
            smoothing: 0.1
        });
        
        // Initialize entity manager
        this.entityManager = new EntityManager();
        
        // Setup event listeners
        this.setupEventListeners();
        
        Logger.info('Application initialized successfully');
    }
    
    /**
     * Setup window and focus event listeners
     */
    private setupEventListeners(): void {
        // Window resize
        window.addEventListener('resize', () => {
            this.engine.resize();
            const viewport = Environment.viewport;
            this.eventBus.emit('app:resize', viewport);
            Logger.debug('Window resized:', viewport);
        });
        
        // Focus gained
        window.addEventListener('focus', () => {
            this.eventBus.emit('app:focus', { gained: true });
            Logger.info('App gained focus');
            if (!this.isRunning) {
                this.isRunning = true;
                Logger.info('Rendering resumed');
            }
        });
        
        // Focus lost
        window.addEventListener('blur', () => {
            this.eventBus.emit('app:focus', { gained: false });
            Logger.info('App lost focus');
            this.isRunning = false; // Pause rendering
            this.inputSystem.getState().clear(); // Clear input state
        });
    }
    
    /**
     * Start the application and render loop
     */
    public async start(): Promise<void> {
        if (this.isRunning) {
            Logger.warn('Application already running');
            return;
        }
        
        Logger.info('Starting application...');
        
        // Show loading screen
        this.engine.displayLoadingUI();
        
        // Initialize physics engine
        await this.physicsManager.init();
        
        // Initialize ground physics now that physics is ready
        this.initGroundPhysics();
        
        // Create test level with obstacles
        this.testLevel = new TestLevel(this.scene, this.physicsManager);
        this.testLevel.create();
        
        // Simulate async loading
        await this.load();
        
        // Hide loading screen
        this.engine.hideLoadingUI();
        
        // Start render loop
        this.isRunning = true;
        this.engine.runRenderLoop(() => {
            this.stats.begin();
            
            if (this.isRunning) {
                const deltaTime = this.engine.getDeltaTime();
                
                // Update input system
                this.inputSystem.update(deltaTime);
                
                // Update camera
                this.cameraController.update(deltaTime);
                
                // Update all entities
                this.entityManager.update(deltaTime);
                
                // Update input debug UI
                if (this.inputDebugUI) {
                    this.inputDebugUI.update();
                }
                
                // Update player debug UI
                if (this.playerDebugUI) {
                    this.playerDebugUI.update();
                }
                
                this.scene.render();
            }
            
            this.stats.end();
        });
        
        Logger.info('Application started successfully');
    }
    
    /**
     * Simulate loading resources
     */
    private async load(): Promise<void> {
        return new Promise((resolve) => {
            Logger.info('Loading resources...');
            this.eventBus.emit('loading:started', { total: 100 });
            
            let progress = 0;
            const interval = setInterval(() => {
                progress += 10;
                this.eventBus.emit('loading:progress', { loaded: progress, total: 100 });
                
                if (progress >= 100) {
                    clearInterval(interval);
                    this.eventBus.emit('loading:complete', {});
                    Logger.info('Loading complete');
                    
                    // Create player after loading
                    this.createPlayer();
                    
                    // Create shared debug UI texture (foreground layer)
                    this.sharedDebugTexture = BABYLONGUI.AdvancedDynamicTexture.CreateFullscreenUI('DebugUI', true);
                    Logger.info('Shared debug texture created (foreground)');
                    
                    // Create input debug UI with shared texture
                    this.inputDebugUI = new InputDebugUI(this.inputSystem, this.sharedDebugTexture);
                    Logger.info('Input debug UI created, controls on texture: ' + this.sharedDebugTexture.rootContainer.children.length);
                    
                    // Create player debug UI with shared texture using stored player reference
                    if (this.player) {
                        this.playerDebugUI = new PlayerDebugUI(this.player, this.sharedDebugTexture);
                        Logger.info('Player debug UI created, total controls on texture: ' + this.sharedDebugTexture.rootContainer.children.length);
                    } else {
                        Logger.warn('Player entity not found for debug UI!');
                    }
                    
                    resolve();
                }
            }, 200);
        });
    }
    
    /**
     * Create player entity
     */
    private createPlayer(): void {
        this.player = new SimplePlayer(this.scene, this.inputSystem);
        this.player.init();
        this.entityManager.add(this.player);
        
        // Set camera controller for camera-relative movement
        this.player.setCameraController(this.cameraController);
        
        // Make camera follow player
        this.cameraController.setTarget(this.player);
        
        // Expose player to window for console access
        (window as any).player = this.player;
        
        Logger.info('Player added to entity manager');
        Logger.info('💡 Tip: Access player via console with: window.player.setMaxWalkableSlope(30)');
    }
    
    /**
     * Create ground plane with grid material and physics
     */
    private createGround(): void {
        // Create white solid ground base
        const groundBase = BABYLON.MeshBuilder.CreateGround(
            'groundBase',
            { width: 100, height: 100, subdivisions: 2 },
            this.scene
        );
        
        const baseMaterial = new BABYLON.StandardMaterial('groundBaseMat', this.scene);
        baseMaterial.diffuseColor = new BABYLON.Color3(1.0, 1.0, 1.0); // White
        baseMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        groundBase.material = baseMaterial;
        groundBase.position.y = 0;
        groundBase.checkCollisions = true;
        
        // Create grid overlay
        const ground = BABYLON.MeshBuilder.CreateGround(
            'ground',
            { width: 100, height: 100, subdivisions: 20 },
            this.scene
        );
        
        // Create grid material with brighter, thicker lines
        const groundMaterial = new BABYLON.StandardMaterial('groundMat', this.scene);
        groundMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.6); // Brighter lines
        groundMaterial.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
        groundMaterial.wireframe = true;
        
        ground.material = groundMaterial;
        ground.position.y = 0.001; // Slightly above base to prevent z-fighting
        ground.checkCollisions = false; // Only base needs collisions
        
        // Store reference for physics initialization later
        (this as any)._ground = groundBase;
        
        Logger.info('Ground with white base and grid overlay created');
    }
    
    /**
     * Add physics to ground (called after physics is initialized)
     */
    private initGroundPhysics(): void {
        const ground = (this as any)._ground as BABYLON.Mesh;
        if (ground && this.physicsManager.initialized) {
            // Add static physics body to ground
            this.physicsManager.createBody(
                ground,
                'static',
                {
                    friction: 0.5, // Moderate friction (reduced from 0.8)
                    restitution: 0.0,
                    shape: 'box'
                }
            );
            Logger.info('Ground physics initialized');
        }
    }
    
    /**
     * Stop the application
     */
    public stop(): void {
        Logger.info('Stopping application...');
        this.isRunning = false;
    }
    
    /**
     * Dispose and cleanup
     */
    public dispose(): void {
        Logger.info('Disposing application...');
        this.stop();
        
        // Dispose all entities
        this.entityManager.dispose();
        
        // Dispose test level
        if (this.testLevel) {
            this.testLevel.dispose();
        }
        
        // Dispose camera controller
        this.cameraController.dispose();
        
        // Dispose input debug UI
        if (this.inputDebugUI) {
            this.inputDebugUI.dispose();
        }
        
        // Dispose player debug UI
        if (this.playerDebugUI) {
            this.playerDebugUI.dispose();
        }
        
        // Dispose shared debug texture
        if (this.sharedDebugTexture) {
            this.sharedDebugTexture.dispose();
            Logger.info('Shared debug texture disposed');
        }
        
        // Dispose input system
        this.inputSystem.dispose();
        
        // Dispose scene first (this will dispose physics bodies)
        this.scene.dispose();
        
        // Dispose physics manager after scene
        this.physicsManager.dispose();
        
        this.engine.dispose();
        this.eventBus.clear();
    }
    
    /**
     * Get the event bus instance
     */
    public getEventBus(): EventBus {
        return this.eventBus;
    }
    
    /**
     * Get the BabylonJS scene
     */
    public getScene(): BABYLON.Scene {
        return this.scene;
    }
    
    /**
     * Get the BabylonJS engine
     */
    public getEngine(): BABYLON.Engine {
        return this.engine;
    }
    
    /**
     * Get the input system
     */
    public getInputSystem(): InputSystem {
        return this.inputSystem;
    }
    
    /**
     * Get the entity manager
     */
    public getEntityManager(): EntityManager {
        return this.entityManager;
    }
    
    /**
     * Get the camera controller
     */
    public getCameraController(): CameraController {
        return this.cameraController;
    }
    
    /**
     * Get the physics manager
     */
    public getPhysicsManager(): PhysicsManager {
        return this.physicsManager;
    }
}
