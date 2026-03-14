import * as BABYLON from '@babylonjs/core';

export interface ReimplLevel {
    readonly id: string;
    readonly displayName: string;
    readonly spawnPosition: BABYLON.Vector3;
    init(): Promise<void> | void;
    dispose(): void;
}