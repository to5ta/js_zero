// import * as BABYLON from "@babylonjs/core";
// import "@babylonjs/loaders";

// class Hearts extends GameEventDispatcher {
//     private scene: BABYLON.Scene;

//     constructor(scene: BABYLON.Scene, position: BABYLON.Vector3) {
//         this.scene = scene;
//         this.model = model;

//         var assetTask = assetManager.addMeshTask(
//             "PlayerModel", 
//             null, 
//             './', 
//             modelfile);
            
//         assetTask.onSuccess = () => {
//             this.mMesh = assetTask.loadedMeshes[0] as BABYLON.Mesh;
//             this.mMesh.rotation = BABYLON.Vector3.Zero();
            
//             assetTask.loadedAnimationGroups.forEach((aniGroup) =>
//             {
//                 this.mNamedAnimations[aniGroup.name] = aniGroup;
//             });     
//             this.onPartLoaded("mesh");
    
//         public dispose() {
//             this.model.dispose();
//         }
//     }

// }
