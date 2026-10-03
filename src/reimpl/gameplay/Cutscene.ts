import * as BABYLON from '@babylonjs/core';
import { Logger } from '../core/Logger';

/**
 * A short camera move on its own camera.
 *
 * The chamber is read from a third-person camera at floor level, where three
 * plates spread over twenty units and a gate at the far end never fit in one
 * frame. The player cannot assemble the puzzle from what they can see. This
 * states it in one pass: gate and runes, across the plates, resting on the
 * blocks.
 *
 * Always skippable. A player on their second run should never be made to watch
 * it again, and the skip is any input at all rather than a specific key.
 */

export interface CutsceneWaypoint {
    position: BABYLON.Vector3;
    target: BABYLON.Vector3;
    /** Seconds spent travelling from the previous waypoint to this one. */
    duration: number;
}

const FADE_SECONDS = 0.45;

export class Cutscene {
    private camera?: BABYLON.FreeCamera;
    private previousCamera?: BABYLON.Camera;
    private elapsed = 0;
    private running = false;
    private finished = false;
    private skipHint?: HTMLDivElement;
    private onDone?: () => void;

    constructor(
        private readonly scene: BABYLON.Scene,
        private readonly waypoints: CutsceneWaypoint[]
    ) {}

    public get isRunning(): boolean {
        return this.running;
    }

    public get hasPlayed(): boolean {
        return this.finished;
    }

    public start(onDone?: () => void): void {
        if (this.running || this.finished || this.waypoints.length < 2) return;

        this.onDone = onDone;
        this.previousCamera = this.scene.activeCamera ?? undefined;

        this.camera = new BABYLON.FreeCamera('cutsceneCamera', this.waypoints[0].position.clone(), this.scene);
        this.camera.setTarget(this.waypoints[0].target.clone());
        // Never attach control: the camera is on rails and a stray drag during
        // the move would fight the animation.
        this.scene.activeCamera = this.camera;

        this.elapsed = 0;
        this.running = true;
        this.showSkipHint();
        Logger.info('Cutscene started');
    }

    /** Any input ends it. */
    public skip(): void {
        if (this.running) {
            this.stop();
        }
    }

    public update(deltaSeconds: number): void {
        if (!this.running || !this.camera) return;

        this.elapsed += deltaSeconds;

        let remaining = this.elapsed;
        for (let i = 1; i < this.waypoints.length; i++) {
            const leg = this.waypoints[i];
            if (remaining < leg.duration) {
                const from = this.waypoints[i - 1];
                // Smoothstep, so each leg eases in and out instead of snapping
                // direction at every waypoint.
                const t = remaining / leg.duration;
                const eased = t * t * (3 - 2 * t);
                this.camera.position = BABYLON.Vector3.Lerp(from.position, leg.position, eased);
                this.camera.setTarget(BABYLON.Vector3.Lerp(from.target, leg.target, eased));
                return;
            }
            remaining -= leg.duration;
        }

        this.stop();
    }

    private stop(): void {
        if (!this.running) return;
        this.running = false;
        this.finished = true;

        if (this.previousCamera) {
            this.scene.activeCamera = this.previousCamera;
        }
        this.camera?.dispose();
        this.camera = undefined;
        this.hideSkipHint();

        this.onDone?.();
        this.onDone = undefined;
        Logger.info('Cutscene finished');
    }

    private showSkipHint(): void {
        this.skipHint = document.createElement('div');
        this.skipHint.textContent = 'Tap or press any key to skip';
        this.skipHint.style.position = 'fixed';
        this.skipHint.style.bottom = 'calc(28px + env(safe-area-inset-bottom, 0px))';
        this.skipHint.style.left = '50%';
        this.skipHint.style.transform = 'translateX(-50%)';
        this.skipHint.style.padding = '6px 14px';
        this.skipHint.style.borderRadius = '999px';
        this.skipHint.style.background = 'rgba(14, 13, 11, 0.6)';
        this.skipHint.style.border = '1px solid rgba(198, 160, 94, 0.28)';
        this.skipHint.style.color = '#e8dfcc';
        this.skipHint.style.fontSize = '12px';
        this.skipHint.style.letterSpacing = '0.04em';
        this.skipHint.style.zIndex = '10001';
        this.skipHint.style.pointerEvents = 'none';
        this.skipHint.style.opacity = '0';
        this.skipHint.style.transition = `opacity ${FADE_SECONDS}s linear`;
        document.body.appendChild(this.skipHint);
        // Next frame, so the transition has a value to animate from.
        requestAnimationFrame(() => {
            if (this.skipHint) this.skipHint.style.opacity = '1';
        });
    }

    private hideSkipHint(): void {
        this.skipHint?.remove();
        this.skipHint = undefined;
    }

    public dispose(): void {
        this.stop();
        this.hideSkipHint();
    }
}

/**
 * The establishing pass over the trial chamber, in the order the player needs
 * the information: what is locked, what counts, what you have to work with.
 */
export function createChamberIntro(): CutsceneWaypoint[] {
    const v = (x: number, y: number, z: number) => new BABYLON.Vector3(x, y, z);

    return [
        // High over the doorway, looking down the room at the gate.
        { position: v(16.0, 9.5, -58.0), target: v(10.0, 4.0, -70.0), duration: 0 },
        // Drop towards the gate and its runes.
        { position: v(8.5, 5.6, -65.0), target: v(6.0, 4.6, -70.4), duration: 3.0 },
        // Sweep back across the three plates.
        { position: v(13.5, 4.4, -63.0), target: v(13.5, 2.0, -66.0), duration: 2.6 },
        // Settle on the two blocks by the entrance.
        { position: v(18.6, 3.6, -60.0), target: v(17.8, 2.3, -63.4), duration: 2.2 },
    ];
}
