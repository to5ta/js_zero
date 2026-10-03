import * as BABYLON from '@babylonjs/core';
import * as BABYLONGUI from '@babylonjs/gui';
import { EventBus } from './EventBus';
import { Environment } from './Environment';
import { Logger } from './Logger';
import { LoadingScreen } from '../ui/LoadingScreen';
import { InputDebugUI } from '../ui/InputDebugUI';
import { PlayerDebugUI } from '../ui/PlayerDebugUI';
import { HealthDisplay } from '../ui/HealthDisplay';
import { FullscreenButton } from '../ui/FullscreenButton';
import { DebugToggleButton } from '../ui/DebugToggleButton';
import { MobileControlsOverlay } from '../ui/MobileControlsOverlay';
import { MobileTestPanel } from '../ui/MobileTestPanel';
import { InputSystem } from '../systems/InputSystem';
import { CameraController } from '../systems/CameraController';
import { PhysicsManager } from '../systems/PhysicsManager';
import { EntityManager } from '../entities/EntityManager';
import { SimplePlayer } from '../entities/SimplePlayer';
import Stats from 'stats-js';
import { getLevelDefinition, LevelId } from '../config/LevelCatalog';
import { ReimplLevel } from '../levels/ReimplLevel';
import { PuzzleChamber } from '../gameplay/PuzzleChamber';
import { Sfx } from '../audio/Sfx';
import { Cutscene, createChamberIntro } from '../gameplay/Cutscene';
import { HintLine } from '../ui/HintLine';
// @ts-ignore - webpack will handle this file
import wache02Model from '../../assets/models/wache02.glb';

interface AppOptions {
    levelId: LevelId;
}

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
    private healthDisplay?: HealthDisplay;
    private fullscreenButton?: FullscreenButton;
    private debugToggleButton?: DebugToggleButton;
    private mobileControls?: MobileControlsOverlay;
    private mobileTestPanel?: MobileTestPanel;
    private debugEnabled: boolean = false;
    private sharedDebugTexture?: BABYLONGUI.AdvancedDynamicTexture;
    private player?: SimplePlayer;
    private activeLevel?: ReimplLevel;
    private puzzleChamber?: PuzzleChamber;
    private cutscene?: Cutscene;
    private hintLine?: HintLine;
    private stuckSeconds = 0;
    private hintShown = false;
    private readonly sfx = new Sfx();
    private readonly levelDefinition;
    private playerSpawnPoint: BABYLON.Vector3 = new BABYLON.Vector3(0, 2.0, 0);
    
    constructor(options: AppOptions) {
        Logger.info('Initializing application...');
        this.levelDefinition = getLevelDefinition(options.levelId);
        Logger.info(`Selected level: ${this.levelDefinition.displayName} (${this.levelDefinition.id})`);
        
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
        
        // Create optional default ground for sandbox/test levels
        if (this.levelDefinition.useDefaultGround) {
            this.createGround();
        }
        
        Logger.debug('Scene setup complete with light and ground');
        
        // Setup custom loading screen
        this.loadingScreen = new LoadingScreen(this.eventBus);
        this.engine.loadingScreen = this.loadingScreen;
        
        // Setup FPS counter. It still runs in production because the render loop
        // calls begin/end, but only development puts its panel on screen — in a
        // release build it would sit on top of the health bar.
        this.stats = new Stats();
        this.stats.showPanel(0); // 0: fps, 1: ms, 2: mb
        if (__DEV__) {
            // Below the health bar, which owns the top left corner.
            this.stats.dom.style.top = '52px';
            this.stats.dom.style.left = '10px';
            document.body.appendChild(this.stats.dom);
        }
        Logger.debug('FPS counter added');
        
        // Initialize input system
        this.inputSystem = new InputSystem(Environment.canvas);
        
        // Initialize fullscreen button (F key to toggle)
        this.fullscreenButton = new FullscreenButton(this.inputSystem.getState());

        // Debug toggle button (under fullscreen)
        this.debugToggleButton = new DebugToggleButton((enabled) => {
            this.setDebugEnabled(enabled);
        }, this.debugEnabled);

        if (Environment.isMobile) {
            this.mobileControls = new MobileControlsOverlay(this.inputSystem.getState());
        }

        if (__DEV__ && !Environment.isPhysicalMobile) {
            this.mobileTestPanel = new MobileTestPanel();
        }
        
        // Initialize physics manager
        this.physicsManager = new PhysicsManager(this.scene);
        
        // Initialize camera controller
        this.cameraController = new CameraController(this.scene, Environment.canvas, this.inputSystem, {
            distance: 8,
            angularSensibilityX: 1500,
            angularSensibilityY: 1500,
            upperBetaLimit: 1.7,
            lowerBetaLimit: 0.1
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
        
        // Player death event
        this.eventBus.on('player:died', () => {
            this.handlePlayerDeath();
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
        
        // Initialize optional ground physics now that physics is ready
        if (this.levelDefinition.useDefaultGround) {
            this.initGroundPhysics();
        }
        
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

                this.updatePuzzle(deltaTime);
                
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
        Logger.info('Loading resources...');
        const totalSteps = 3;
        let completedSteps = 0;

        this.eventBus.emit('loading:started', { total: totalSteps });

        const markProgress = (): void => {
            completedSteps += 1;
            this.eventBus.emit('loading:progress', { loaded: completedSteps, total: totalSteps });
        };

        await this.loadLevel();
        markProgress();

        await this.createPlayer();
        markProgress();

        this.createOverlayUi();
        markProgress();

        this.eventBus.emit('loading:complete', {});
        Logger.info('Loading complete');
    }

    private async loadLevel(): Promise<void> {
        this.activeLevel = this.levelDefinition.createLevel(this.scene, this.physicsManager);
        await this.activeLevel.init();
        this.playerSpawnPoint = this.activeLevel.spawnPosition.clone();
        Logger.info(`🌍 Active level ready: ${this.activeLevel.displayName}`);

        if (this.levelDefinition.id === 'level1') {
            this.puzzleChamber = new PuzzleChamber(this.scene, this.sfx);
            this.puzzleChamber.build();
            this.cutscene = new Cutscene(this.scene, createChamberIntro());
            this.hintLine = new HintLine();
            // Spawn at the foot of the stairs instead of the map origin, which is
            // a seventy unit walk away from the only thing to do.
            this.playerSpawnPoint = new BABYLON.Vector3(15.0, 0.6, -56.0);
        }
    }

    private createOverlayUi(): void {
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
        
        // Create health display with shared texture
        this.healthDisplay = new HealthDisplay(this.eventBus, this.sharedDebugTexture);
        Logger.info('Health display created');

        // Apply current debug visibility preference
        this.applyDebugVisibility();
    }
    
    /**
     * Create player entity
     */
    private async createPlayer(): Promise<void> {
        this.player = new SimplePlayer(this.scene, this.inputSystem, this.eventBus);
        this.player.init();
        this.player.position = this.playerSpawnPoint.clone();
        this.entityManager.add(this.player);
        
        // Set camera controller for camera-relative movement
        this.player.setCameraController(this.cameraController);
        
        // Make camera follow player
        this.cameraController.setTarget(this.player);
        
        // Load player visualization (wache02 model)
        try {
            await this.player.loadVisualization(
                wache02Model,
                {
                    'idle': {
                        loop: true,
                        speed: 1.0,
                        from: 0,
                        to: 60,
                    },
                    'walk': {
                        loop: true,
                        speed: 1.0,
                        from: 61,
                        to: 120,
                    },
                    'run': {
                        loop: true,
                        speed: 1.2,
                        from: 121,
                        to: 180,
                    },
                    'jump': {
                        loop: false,
                        speed: 1.0
                    },
                    'fall': {
                        loop: true,
                        speed: 1.2
                    },
                    'sprint': {
                        loop: true,
                        speed: 1.5
                    },
                    'dieOnFall': {
                        loop: false,
                        speed: 1.0,
                        from: 0,
                        to: 100
                    }
                }
            );

            const visualization = this.player.getVisualization();
            visualization?.play('idle');

            Logger.info('🎨 Player model loaded successfully');
        } catch (error) {
            Logger.warn(`Could not load player model: ${error}`);
        }
        
        // Expose player to window for console access
        (window as any).player = this.player;
        (window as any).setDebugVisuals = (enabled: boolean) => SimplePlayer.setDebugVisualsEnabled(enabled);
        (window as any).toggleDebugUI = () => {
            if (this.playerDebugUI) this.playerDebugUI.toggle();
            if (this.inputDebugUI) this.inputDebugUI.toggle();
        };
        (window as any).activeLevel = this.activeLevel;
        
        Logger.info('Player added to entity manager');
        Logger.info('💡 Console commands:');
        Logger.info('  - window.player.setMaxWalkableSlope(angle)');
        Logger.info('  - window.setDebugVisuals(true/false) - Toggle 3D debug lines');
        Logger.info('  - window.toggleDebugUI() - Toggle debug UI panels');
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
        
        // Dispose active level
        if (this.activeLevel) {
            this.activeLevel.dispose();
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
        
        // Dispose health display
        if (this.healthDisplay) {
            this.healthDisplay.dispose();
        }

        // Dispose debug toggle button
        if (this.debugToggleButton) {
            this.debugToggleButton.dispose();
        }

        // Dispose mobile controls
        if (this.mobileControls) {
            this.mobileControls.dispose();
        }

        // Dispose mobile test panel
        if (this.mobileTestPanel) {
            this.mobileTestPanel.dispose();
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

    /**
     * Enable/disable all debug visuals and overlays
     */
    private setDebugEnabled(enabled: boolean): void {
        this.debugEnabled = enabled;
        this.applyDebugVisibility();
    }

    /**
     * Apply current debug visibility preference to visuals and UIs
     */
    private applyDebugVisibility(): void {
        // 3D debug visuals (axes, rays)
        SimplePlayer.setDebugVisualsEnabled(this.debugEnabled);

        // GUI overlays
        if (this.inputDebugUI) {
            this.debugEnabled ? this.inputDebugUI.show?.() : this.inputDebugUI.hide?.();
        }
        if (this.playerDebugUI) {
            this.debugEnabled ? this.playerDebugUI.show() : this.playerDebugUI.hide();
        }
    }
    
    /**
     * Handle player death event
     */
    private handlePlayerDeath(): void {
        Logger.warn('💀 Player died - respawning in 3 seconds...');
        
        // Wait 3 seconds before respawning
        setTimeout(() => {
            this.resetPlayer();
        }, 3000);
    }
    
    /**
     * Reset player to initial state
     */
    private resetPlayer(): void {
        if (!this.player) {
            Logger.error('Cannot reset player - player entity not found');
            return;
        }
        
        Logger.info('🔄 Resetting player...');
        
        // Reset health
        this.player.resetHealth();
        
        // Reset position to spawn point
        this.player.position = this.playerSpawnPoint.clone();
        
        // Clear velocity
        this.player.resetVelocity();
        
        Logger.info('✅ Player reset complete');
    }

    /**
     * Drive the chamber and keep the action prompt in sync with what is in reach.
     */
    private updatePuzzle(deltaTimeMs: number): void {
        if (!this.puzzleChamber || !this.player) return;

        const position = this.player.position;

        if (this.updateCutscene(deltaTimeMs / 1000, position)) {
            return;
        }

        this.updateStuckHint(deltaTimeMs / 1000, position);

        const facing = this.player.getLastMoveDirection
            ? this.player.getLastMoveDirection()
            : BABYLON.Vector3.Forward();
        const flatFacing = new BABYLON.Vector3(facing.x, 0, facing.z);
        const direction = flatFacing.lengthSquared() > 0.0001
            ? flatFacing.normalize()
            : new BABYLON.Vector3(0, 0, 1);

        if (this.inputSystem.getState().consumeActionPress()) {
            // Browsers only allow audio to start from a gesture, and this is the
            // first one the game can be sure of.
            this.sfx.unlock();
            this.puzzleChamber.toggleCarry(position, direction);
        }

        this.puzzleChamber.update(deltaTimeMs / 1000, position, direction);

        if (this.mobileControls) {
            const hint = this.puzzleChamber.holding
                ? 'Set down'
                : this.puzzleChamber.findInteractable(position)
                    ? 'Pick up'
                    : null;
            this.mobileControls.setActionHint(hint);
        }
    }

    /**
     * Fires the intro once the player is actually inside the antechamber, not on
     * load: starting it at spawn would play over the walk up the stairs, and the
     * room it describes would not be on screen yet.
     *
     * @returns true while the cutscene owns the frame, so the puzzle does not
     *          also advance behind it.
     */
    private updateCutscene(deltaSeconds: number, position: BABYLON.Vector3): boolean {
        if (!this.cutscene) return false;

        if (this.cutscene.isRunning) {
            // Checked before the input is cleared, otherwise the skip can never
            // be seen.
            const state = this.inputSystem.getState();
            const wantsSkip =
                state.isActionPressed() ||
                state.isJumpPressed() ||
                state.getMovementInput().lengthSquared() > 0.01;

            if (wantsSkip) {
                this.cutscene.skip();
            } else {
                this.cutscene.update(deltaSeconds);
                // Freeze the player for the duration; it is on rails and a
                // walking character under the camera would be a distraction.
                state.clear();
                return true;
            }
        }

        if (!this.cutscene.hasPlayed && this.isInsideChamber(position)) {
            this.sfx.unlock();
            this.cutscene.start();
            return true;
        }

        return false;
    }

    private isInsideChamber(position: BABYLON.Vector3): boolean {
        return (
            position.x > 3.5 && position.x < 23.5 &&
            position.z > -82.0 && position.z < -62.0 &&
            position.y > 1.0
        );
    }

    /**
     * The fallback under the visual cues. It only speaks up once the player has
     * seen the gate open and still has not gone through, which is when the wrong
     * reading takes hold.
     */
    private updateStuckHint(deltaSeconds: number, position: BABYLON.Vector3): void {
        if (!this.puzzleChamber || !this.hintLine || this.hintShown) return;

        // Past the cross wall means they solved it; nothing left to hint at.
        if (position.z < -70.5) {
            this.hintShown = true;
            return;
        }

        if (!this.puzzleChamber.isSolved) return;

        this.stuckSeconds += deltaSeconds;
        if (this.stuckSeconds > 25) {
            this.hintShown = true;
            this.hintLine.show('The gate does not drop at once. Weigh the last plate, then run.', 9);
        }
    }

}
