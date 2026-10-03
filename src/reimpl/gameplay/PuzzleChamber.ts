import * as BABYLON from '@babylonjs/core';
import { Logger } from '../core/Logger';
import { Sfx } from '../audio/Sfx';

/**
 * The trial chamber on the stone plateau.
 *
 * Everything here is plain boxes with checkCollisions, deliberately not Havok
 * bodies: the player moves with moveWithCollisions against Babylon's own
 * collision system, so a Havok body would be something it walks straight
 * through. Keeping the whole chamber in code also means positions and timings
 * are tunable without re-exporting a model.
 *
 * The puzzle: three plates hold the gate, two blocks exist. The third weight
 * has to be the player, who then has to reach the gate before it seats again.
 */

/** Plateau footprint, measured from the level mesh. */
const FLOOR_Y = 1.9;
/** Tall enough to leave a real lintel above the gate for the runes and the timer. */
const WALL_HEIGHT = 4.4;
const WALL_THICKNESS = 0.6;

/**
 * How long the gate takes to seat after a plate is released.
 *
 * Six rather than four because there is no sprint on mobile: the run from the
 * far plate is about 17 units, which a walking player covers in under three
 * seconds. The puzzle should be a puzzle, not a reaction test.
 */
export const GATE_GRACE_SECONDS = 6.0;
const GATE_TRAVEL_SECONDS = 1.1;
const GATE_HEIGHT = 3.0;

const PLATE_SIZE = 1.6;
const PLATE_SINK = 0.09;
const PLATE_TRIGGER_RADIUS = 1.15;

const BLOCK_SIZE = 0.9;
const REACH = 2.4;

interface Plate {
    mesh: BABYLON.Mesh;
    rune: BABYLON.Mesh;
    restY: number;
    weighted: boolean;
}

export interface Carryable {
    mesh: BABYLON.Mesh;
    heldBy: boolean;
}

export class PuzzleChamber {
    private readonly meshes: BABYLON.Mesh[] = [];
    private readonly plates: Plate[] = [];
    private readonly blocks: Carryable[] = [];

    private gate?: BABYLON.Mesh;
    private gateClosedY = 0;
    private gateOpenAmount = 0;
    private gateShouldBeOpen = false;
    private graceRemaining = 0;
    private solved = false;
    private held?: Carryable;

    private timerBar?: BABYLON.Mesh;
    private timerBarWidth = 2.9;
    private timerBarBaseX = 6.0;

    private stoneMat!: BABYLON.StandardMaterial;
    private gateMat!: BABYLON.StandardMaterial;
    private bandMat!: BABYLON.StandardMaterial;
    private timerMat!: BABYLON.StandardMaterial;
    private plateMat!: BABYLON.StandardMaterial;
    private plateLitMat!: BABYLON.StandardMaterial;
    private blockMat!: BABYLON.StandardMaterial;
    private runeMat!: BABYLON.StandardMaterial;
    private runeLitMat!: BABYLON.StandardMaterial;

    constructor(
        private readonly scene: BABYLON.Scene,
        private readonly sfx: Sfx
    ) {}

    public build(): void {
        this.createMaterials();
        this.createWalls();
        this.createGate();
        this.createTimerBar();
        this.createPlates();
        this.createBlocks();
        Logger.info('Puzzle chamber built');
    }

    private createMaterials(): void {
        // The scene is lit by a single hemispheric light pointing straight up, so
        // vertical faces receive almost nothing. Every material here carries a
        // base emissive term to stand in for the missing fill light — without it
        // the walls render as black slabs next to the bright cobblestone floor.
        const mat = (name: string, diffuse: BABYLON.Color3, emissive: BABYLON.Color3) => {
            const m = new BABYLON.StandardMaterial(name, this.scene);
            m.diffuseColor = diffuse;
            m.emissiveColor = emissive;
            m.specularColor = new BABYLON.Color3(0.04, 0.04, 0.04);
            return m;
        };

        this.stoneMat = mat('chamberStone', new BABYLON.Color3(0.60, 0.57, 0.51), new BABYLON.Color3(0.20, 0.19, 0.17));
        // The gate needs its own, markedly darker stone. Sharing the wall material
        // made it read as a continuous wall, so a player could stand in the room
        // without registering there was a door in it at all.
        this.gateMat = mat('chamberGate', new BABYLON.Color3(0.26, 0.24, 0.22), new BABYLON.Color3(0.07, 0.065, 0.06));
        this.bandMat = mat('chamberBand', new BABYLON.Color3(0.17, 0.16, 0.15), new BABYLON.Color3(0.05, 0.05, 0.05));
        this.timerMat = mat('chamberTimer', new BABYLON.Color3(0.80, 0.63, 0.30), new BABYLON.Color3(0.85, 0.60, 0.18));
        this.plateMat = mat('chamberPlate', new BABYLON.Color3(0.42, 0.39, 0.35), new BABYLON.Color3(0.11, 0.10, 0.09));
        this.plateLitMat = mat('chamberPlateLit', new BABYLON.Color3(0.56, 0.44, 0.24), new BABYLON.Color3(0.50, 0.33, 0.10));
        this.blockMat = mat('chamberBlock', new BABYLON.Color3(0.66, 0.56, 0.40), new BABYLON.Color3(0.20, 0.16, 0.11));
        this.runeMat = mat('chamberRune', new BABYLON.Color3(0.30, 0.28, 0.25), new BABYLON.Color3(0.07, 0.06, 0.05));
        this.runeLitMat = mat('chamberRuneLit', new BABYLON.Color3(0.78, 0.62, 0.30), new BABYLON.Color3(0.82, 0.58, 0.18));
    }

    private box(name: string, w: number, h: number, d: number, x: number, z: number, material: BABYLON.StandardMaterial, yBase = FLOOR_Y): BABYLON.Mesh {
        const mesh = BABYLON.MeshBuilder.CreateBox(name, { width: w, height: h, depth: d }, this.scene);
        mesh.position.set(x, yBase + h / 2, z);
        mesh.material = material;
        mesh.checkCollisions = true;
        this.meshes.push(mesh);
        return mesh;
    }

    /**
     * Outer walls with a doorway where the stairs arrive, plus the cross wall
     * that splits antechamber from inner room.
     */
    private createWalls(): void {
        const t = WALL_THICKNESS;
        const h = WALL_HEIGHT;

        // North edge (far side) and the two long sides.
        this.box('chamberWallN', 22.3, h, t, 13.5, -82.7, this.stoneMat);
        this.box('chamberWallW', t, h, 22.3, 2.7, -71.8, this.stoneMat);
        this.box('chamberWallE', t, h, 22.3, 24.4, -71.8, this.stoneMat);

        // South edge, split around the stair doorway at x 18..22.
        this.box('chamberWallS1', 15.3, h, t, 10.05, -61.0, this.stoneMat);
        this.box('chamberWallS2', 2.4, h, t, 23.5, -61.0, this.stoneMat);

        // Cross wall at z = -70.5, split around the gate at x 4.5..7.5.
        this.box('chamberCrossW', 1.8, h, t, 3.6, -70.5, this.stoneMat);
        this.box('chamberCrossE', 17.2, h, t, 16.1, -70.5, this.stoneMat);

        // Lintel over the gate, so the opening reads as a doorway rather than a
        // gap in an unfinished wall.
        const lintelHeight = WALL_HEIGHT - GATE_HEIGHT;
        if (lintelHeight > 0.05) {
            this.box('chamberLintel', 3.0, lintelHeight, t, 6.0, -70.5, this.stoneMat, FLOOR_Y + GATE_HEIGHT);
        }
    }

    private createGate(): void {
        const gate = BABYLON.MeshBuilder.CreateBox(
            'chamberGate',
            { width: 2.9, height: GATE_HEIGHT, depth: WALL_THICKNESS * 0.8 },
            this.scene
        );
        gate.material = this.gateMat;
        gate.checkCollisions = true;
        gate.position.set(6.0, FLOOR_Y + GATE_HEIGHT / 2, -70.5);
        this.gateClosedY = gate.position.y;
        this.gate = gate;
        this.meshes.push(gate);

        // Iron bands across the slab. They are what makes it read as a door from
        // across the room rather than as a slightly different patch of wall.
        [-0.85, 0.0, 0.85].forEach((offsetY, index) => {
            const band = BABYLON.MeshBuilder.CreateBox(
                `chamberGateBand${index}`,
                { width: 3.0, height: 0.16, depth: WALL_THICKNESS * 0.95 },
                this.scene
            );
            band.material = this.bandMat;
            band.checkCollisions = false;
            band.position.set(0, offsetY, 0);
            band.parent = gate;
            this.meshes.push(band);
        });

        // Jambs framing the opening, so the doorway has an edge even while the
        // slab is raised out of sight.
        [4.35, 7.65].forEach((x, index) => {
            this.box(`chamberJamb${index}`, 0.3, GATE_HEIGHT, WALL_THICKNESS * 1.1, x, -70.5, this.bandMat);
        });
    }

    /**
     * A brass bar over the gate that drains while the grace window runs.
     *
     * Without it the four seconds after stepping off a plate are invisible, and
     * the natural reading of the gate closing is "I need a third block" — a
     * search for something that does not exist. Showing the countdown turns that
     * into "I need to run", which is the actual puzzle.
     */
    private createTimerBar(): void {
        const bar = BABYLON.MeshBuilder.CreateBox(
            'chamberTimerBar',
            { width: this.timerBarWidth, height: 0.14, depth: 0.1 },
            this.scene
        );
        bar.material = this.timerMat;
        bar.checkCollisions = false;
        bar.position.set(this.timerBarBaseX, FLOOR_Y + GATE_HEIGHT + 0.32, -70.14);
        bar.isVisible = false;
        this.timerBar = bar;
        this.meshes.push(bar);
    }

    private createPlates(): void {
        // Plate C sits in the far corner from the gate on purpose: it is the one
        // the player has to stand on, and the run back is the whole challenge.
        const positions: Array<[number, number]> = [
            [5.5, -64.0],
            [13.5, -67.0],
            [21.5, -64.0],
        ];

        positions.forEach(([x, z], index) => {
            const mesh = BABYLON.MeshBuilder.CreateBox(
                `chamberPlate${index}`,
                { width: PLATE_SIZE, height: 0.18, depth: PLATE_SIZE },
                this.scene
            );
            mesh.material = this.plateMat;
            mesh.position.set(x, FLOOR_Y + 0.09, z);
            // Not collidable: the player has to be able to stand on it without
            // being shoved off by its own collision box.
            mesh.checkCollisions = false;
            this.meshes.push(mesh);

            // One rune per plate above the gate, so the state of the puzzle is
            // readable from anywhere in the room without walking over to check.
            const rune = BABYLON.MeshBuilder.CreateBox(
                `chamberRune${index}`,
                { width: 0.42, height: 0.42, depth: 0.12 },
                this.scene
            );
            rune.material = this.runeMat;
            rune.position.set(5.0 + index * 1.0, FLOOR_Y + GATE_HEIGHT + 0.88, -70.14);
            rune.checkCollisions = false;
            this.meshes.push(rune);

            this.plates.push({ mesh, rune, restY: mesh.position.y, weighted: false });
        });
    }

    private createBlocks(): void {
        const positions: Array<[number, number]> = [
            [19.0, -62.6],
            [16.6, -64.4],
        ];

        positions.forEach(([x, z], index) => {
            const mesh = BABYLON.MeshBuilder.CreateBox(
                `chamberBlock${index}`,
                { size: BLOCK_SIZE },
                this.scene
            );
            mesh.material = this.blockMat;
            mesh.position.set(x, FLOOR_Y + BLOCK_SIZE / 2, z);
            mesh.checkCollisions = true;
            this.meshes.push(mesh);
            this.blocks.push({ mesh, heldBy: false });
        });
    }

    /** The block within reach, if any — what the action button would act on. */
    public findInteractable(playerPosition: BABYLON.Vector3): Carryable | undefined {
        if (this.held) return this.held;

        let best: Carryable | undefined;
        let bestDistance = REACH;
        for (const block of this.blocks) {
            const distance = BABYLON.Vector3.Distance(playerPosition, block.mesh.position);
            if (distance < bestDistance) {
                best = block;
                bestDistance = distance;
            }
        }
        return best;
    }

    public get holding(): boolean {
        return !!this.held;
    }

    public get isSolved(): boolean {
        return this.solved;
    }

    /** Pick up the nearest block, or set down the one being carried. */
    public toggleCarry(playerPosition: BABYLON.Vector3, facing: BABYLON.Vector3): void {
        if (this.held) {
            const block = this.held;
            // Drop it a step ahead, snapped to the floor so it always lands flat.
            const target = playerPosition.add(facing.scale(1.1));
            block.mesh.position.set(target.x, FLOOR_Y + BLOCK_SIZE / 2, target.z);
            block.mesh.checkCollisions = true;
            block.heldBy = false;
            this.held = undefined;
            this.sfx.drop();
            return;
        }

        const candidate = this.findInteractable(playerPosition);
        if (!candidate) return;

        candidate.heldBy = true;
        // Off while carried, otherwise it collides with the player holding it.
        candidate.mesh.checkCollisions = false;
        this.held = candidate;
        this.sfx.pickUp();
    }

    /**
     * Advance plates, gate and the grace timer.
     *
     * @param deltaSeconds frame time
     * @param playerPosition the player counts as a weight, like a block does
     * @param facing where a carried block should float
     */
    public update(deltaSeconds: number, playerPosition: BABYLON.Vector3, facing: BABYLON.Vector3): void {
        if (this.held) {
            const carry = playerPosition.add(facing.scale(1.0));
            this.held.mesh.position.set(carry.x, playerPosition.y + 0.35, carry.z);
        }

        let weightedCount = 0;
        for (const plate of this.plates) {
            const weighted = this.isPlateWeighted(plate, playerPosition);
            if (weighted) weightedCount++;

            if (weighted !== plate.weighted) {
                plate.weighted = weighted;
                plate.mesh.material = weighted ? this.plateLitMat : this.plateMat;
                plate.rune.material = weighted ? this.runeLitMat : this.runeMat;
                plate.mesh.position.y = weighted ? plate.restY - PLATE_SINK : plate.restY;
                weighted ? this.sfx.plateDown() : this.sfx.plateUp();
            }
        }

        const allWeighted = weightedCount === this.plates.length;
        if (allWeighted) {
            // Re-arm the grace window every frame the puzzle is fully solved, so
            // the countdown only starts once a plate is actually released.
            this.graceRemaining = GATE_GRACE_SECONDS;
            if (!this.solved) {
                this.solved = true;
                this.sfx.solved();
            }
        } else if (this.graceRemaining > 0) {
            this.graceRemaining = Math.max(0, this.graceRemaining - deltaSeconds);
        }

        const shouldBeOpen = allWeighted || this.graceRemaining > 0;
        if (shouldBeOpen !== this.gateShouldBeOpen) {
            this.gateShouldBeOpen = shouldBeOpen;
            shouldBeOpen ? this.sfx.gateOpen() : this.sfx.gateClose();
        }

        this.updateTimerBar(allWeighted);
        this.animateGate(deltaSeconds, shouldBeOpen);
    }

    /**
     * Show the grace window draining. Hidden while every plate is still held,
     * because then there is nothing to count down.
     */
    private updateTimerBar(allWeighted: boolean): void {
        if (!this.timerBar) return;

        const counting = !allWeighted && this.graceRemaining > 0;
        this.timerBar.isVisible = counting;
        if (!counting) return;

        const fraction = this.graceRemaining / GATE_GRACE_SECONDS;
        this.timerBar.scaling.x = fraction;
        // Shift as it shrinks so the bar drains towards one end instead of
        // closing in on its own centre.
        this.timerBar.position.x = this.timerBarBaseX - (1 - fraction) * (this.timerBarWidth / 2);
    }

    /** How much of the grace window is left, 0 to 1. */
    public get graceFraction(): number {
        return this.graceRemaining / GATE_GRACE_SECONDS;
    }

    /** A plate is held down by the player standing on it or by a block resting on it. */
    private isPlateWeighted(plate: Plate, playerPosition: BABYLON.Vector3): boolean {
        const plateX = plate.mesh.position.x;
        const plateZ = plate.mesh.position.z;

        const playerFlat = Math.hypot(playerPosition.x - plateX, playerPosition.z - plateZ);
        if (playerFlat < PLATE_TRIGGER_RADIUS && Math.abs(playerPosition.y - FLOOR_Y) < 2.0) {
            return true;
        }

        for (const block of this.blocks) {
            if (block.heldBy) continue;
            const flat = Math.hypot(block.mesh.position.x - plateX, block.mesh.position.z - plateZ);
            if (flat < PLATE_TRIGGER_RADIUS) return true;
        }

        return false;
    }

    private animateGate(deltaSeconds: number, open: boolean): void {
        if (!this.gate) return;

        const step = deltaSeconds / GATE_TRAVEL_SECONDS;
        const target = open ? 1 : 0;
        if (this.gateOpenAmount === target) return;

        this.gateOpenAmount = target > this.gateOpenAmount
            ? Math.min(target, this.gateOpenAmount + step)
            : Math.max(target, this.gateOpenAmount - step);

        this.gate.position.y = this.gateClosedY + this.gateOpenAmount * (GATE_HEIGHT + 0.05);
        // Off once it has risen far enough to walk under, so the player is never
        // blocked by a slab that is visibly out of the way.
        this.gate.checkCollisions = this.gateOpenAmount < 0.75;
    }

    public dispose(): void {
        this.meshes.forEach((mesh) => mesh.dispose());
        this.meshes.length = 0;
        this.plates.length = 0;
        this.blocks.length = 0;
        this.gate = undefined;
        this.held = undefined;
        Logger.info('Puzzle chamber disposed');
    }
}
