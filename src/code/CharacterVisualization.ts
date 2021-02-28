import * as BABYLON from "@babylonjs/core";
import "@babylonjs/loaders";

interface animationProperties {
    loop: boolean;
    speed: number;
    from: number;
    to: number;
    soundfile?: string;
}

export class CharacterVisualization {
    
    constructor(
        modelfile: string,
        assetManager: BABYLON.AssetsManager,
        scene: BABYLON.Scene,
        namedAnimationProperties: {[key: string]: animationProperties}) {
        this.mNamedAnimationProperties = namedAnimationProperties;
        
        let soundsCount = 0;
        if (soundsCount==0) {
            this.soundsLoaded = true;
        }
        let soundsLoaded = 0;
        let onSoundLoaded = () => {
            soundsLoaded++;
            if(soundsLoaded == soundsCount){
                this.soundsLoaded = true;
            }
        }
        
        Object.keys(namedAnimationProperties).forEach(aniName => {
            if (namedAnimationProperties[aniName].soundfile) {
                let task = assetManager.addBinaryFileTask(`${aniName}_sound_task`, 
                namedAnimationProperties[aniName].soundfile as string);
                soundsCount++;
                task.onSuccess = (task: BABYLON.BinaryFileAssetTask) => {
                    let soundName = `${aniName}_sound`;
                    this.sounds[soundName] = new BABYLON.Sound(soundName, task.data, scene, onSoundLoaded, {});
                }
            }
        }); 
        
        var assetTask = assetManager.addMeshTask(
            "PlayerModel", 
            null, 
            './', 
            modelfile);
            
        assetTask.onSuccess = () => {
            this.mMesh = assetTask.loadedMeshes[0] as BABYLON.Mesh;
            this.mMesh.rotation = BABYLON.Vector3.Zero();
            let animation = assetTask.loadedAnimationGroups[0];      
            animation.start();
            animation.stop();        
            Object.keys(namedAnimationProperties).forEach(animationName => {
                this.mNamedAnimations[animationName] = animation.clone(animationName);
            });
            
            this.meshLoaded = true;
        }
    }


    isPlaying(animationName: string) : boolean {
        return this.mNamedAnimations[animationName]?.isPlaying ?? false;
    }
         
    
    play(animationName: string): void 
    {
        if (!this.meshLoaded || 
            !Object.keys(this.mNamedAnimations).includes(animationName) ||
            this.isPlaying(animationName)) {
            return;
        } else {
            Object.keys(this.mNamedAnimationProperties).forEach(animationName => { this.mNamedAnimations[animationName].stop() });
            this.mNamedAnimations[animationName].start(
                this.mNamedAnimationProperties[animationName].loop,
                this.mNamedAnimationProperties[animationName].speed,
                this.mNamedAnimationProperties[animationName].from,
                this.mNamedAnimationProperties[animationName].to,
                false);         
        }

        let soundName = `${animationName}_sound`; 
        Object.keys(this.sounds).forEach(otherSoundName => {this.sounds[otherSoundName].stop()});
        if (Object.keys(this.sounds).includes(soundName)) {
            this.playSound(soundName);
        }
    }

    playSound(soundName: string){
        Object.keys(this.sounds).forEach(otherSoundName => {this.sounds[otherSoundName].stop()});
        if (Object.keys(this.sounds).includes(soundName)) {
            this.sounds[soundName].play();
        } 
    }

    setPosition(position: BABYLON.Vector3) {
        this.mMesh.position = position;
    }

    setRotation(rotation: BABYLON.Vector3) {
        this.mMesh.rotation = rotation;
    }

    setOrientation(anzimuth: number) {
        this.mMesh.rotation.y = anzimuth;
    }
            

    sounds: {[key: string]: BABYLON.Sound} = {};
    mNamedAnimations: {[key: string]: BABYLON.AnimationGroup} = {};
    mNamedAnimationProperties: {[key: string]: animationProperties};
    
    private meshLoaded = false;
    private soundsLoaded = false;
    private mMesh: BABYLON.Mesh;

    finishedLoading(): boolean {return this.meshLoaded && this.soundsLoaded};
} 