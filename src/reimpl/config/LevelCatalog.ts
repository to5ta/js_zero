import * as BABYLON from '@babylonjs/core';
import level1Model from '../../assets/models/level1.glb';
import { TestLevel } from '../entities/TestLevel';
import { PhysicsManager } from '../systems/PhysicsManager';
import { ImportedLevel } from '../levels/ImportedLevel';
import { ReimplLevel } from '../levels/ReimplLevel';

export type LevelId = 'level1' | 'test-obstacles';

export interface LevelDefinition {
    id: LevelId;
    displayName: string;
    useDefaultGround: boolean;
    createLevel: (scene: BABYLON.Scene, physicsManager: PhysicsManager) => ReimplLevel;
}

export const LEVEL_CATALOG: Record<LevelId, LevelDefinition> = {
    level1: {
        id: 'level1',
        displayName: 'Level 1',
        useDefaultGround: false,
        createLevel: (scene) => new ImportedLevel(scene, {
            id: 'level1',
            displayName: 'Level 1',
            modelUrl: level1Model,
            spawnPosition: new BABYLON.Vector3(0, 1.2, 0)
        })
    },
    'test-obstacles': {
        id: 'test-obstacles',
        displayName: 'Obstacle Test Level',
        useDefaultGround: true,
        createLevel: (scene, physicsManager) => new TestLevel(scene, physicsManager)
    }
};

export function getLevelDefinition(levelId: LevelId): LevelDefinition {
    return LEVEL_CATALOG[levelId];
}

export function isLevelId(value: string): value is LevelId {
    return value in LEVEL_CATALOG;
}

export function getRuntimeLevelId(): LevelId {
    if (typeof __REIMPL_LEVEL__ === 'string' && isLevelId(__REIMPL_LEVEL__)) {
        return __REIMPL_LEVEL__;
    }

    return 'level1';
}