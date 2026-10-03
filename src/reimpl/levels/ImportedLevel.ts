import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders';
import { Logger } from '../core/Logger';
import { ReimplLevel } from './ReimplLevel';

export interface ImportedLevelOptions {
    id: string;
    displayName: string;
    modelUrl: string;
    spawnPosition: BABYLON.Vector3;
    hiddenObstacleTag?: string;
    noCollisionTag?: string;
}

export class ImportedLevel implements ReimplLevel {
    public readonly id: string;
    public readonly displayName: string;
    public readonly spawnPosition: BABYLON.Vector3;

    private assetContainer?: BABYLON.AssetContainer;
    private readonly hiddenObstacleTag: string;
    private readonly noCollisionTag: string;

    constructor(
        private readonly scene: BABYLON.Scene,
        options: ImportedLevelOptions
    ) {
        this.id = options.id;
        this.displayName = options.displayName;
        this.spawnPosition = options.spawnPosition.clone();
        this.hiddenObstacleTag = options.hiddenObstacleTag ?? '_ho_';
        this.noCollisionTag = options.noCollisionTag ?? '_np_';
        this.modelUrl = options.modelUrl;
    }

    private readonly modelUrl: string;

    public async init(): Promise<void> {
        Logger.info(`Loading imported level: ${this.displayName}`);

        this.assetContainer = await BABYLON.SceneLoader.LoadAssetContainerAsync('', this.modelUrl, this.scene);
        this.assetContainer.addAllToScene();

        this.assetContainer.animationGroups.forEach((animationGroup) => {
            animationGroup.start(true);
        });

        this.assetContainer.meshes.forEach((mesh) => {
            if (!(mesh instanceof BABYLON.Mesh)) {
                return;
            }

            if (!mesh.name.includes(this.noCollisionTag)) {
                mesh.checkCollisions = true;
            }

            if (mesh.name.includes(this.hiddenObstacleTag)) {
                mesh.visibility = 0;
            }
        });

        Logger.info(`✅ Imported level ready: ${this.displayName}`);
    }

    public dispose(): void {
        this.assetContainer?.dispose();
        this.assetContainer = undefined;
        Logger.info(`Imported level disposed: ${this.displayName}`);
    }
}