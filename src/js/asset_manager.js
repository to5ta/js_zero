import * as BABYLON from "babylonjs";
import 'babylonjs-loaders';

// outsource to asset-loader-class later
import sky_px from "../assets/textures/skybox/sky_px.jpg";
import sky_nx from "../assets/textures/skybox/sky_nx.jpg";
import sky_py from "../assets/textures/skybox/sky_py.jpg";
import sky_ny from "../assets/textures/skybox/sky_ny.jpg";
import sky_pz from "../assets/textures/skybox/sky_pz.jpg";
import sky_nz from "../assets/textures/skybox/sky_nz.jpg";

import player_model from "../assets/models/wache02.gltf";


class AssetManagement {
    constructor(scene) {
    
    }


    loadAssets(scene){
        
                    // Load all assets first
        var assetsManager = new BABYLON.AssetsManager(scene);
        var tasks = [];
        tasks.push(assetsManager.addImageTask("sky_px", sky_px));
        tasks.push(assetsManager.addImageTask("sky_nx", sky_nx));
        tasks.push(assetsManager.addImageTask("sky_py", sky_py));
        tasks.push(assetsManager.addImageTask("sky_ny", sky_ny));
        tasks.push(assetsManager.addImageTask("sky_pz", sky_pz));
        tasks.push(assetsManager.addImageTask("sky_nz", sky_nz)); 
        let meshtask = assetsManager.addMeshTask("players mesh", null, './', player_model);
        meshtask.onSuccess = () => {
            console.log("Mesh Task done!");
            console.log("Completed really? ", meshtask.isCompleted);
            console.log("MESHES:", meshtask.loadedMeshes);
            // this.player_mesh = meshtask.loadedMeshes[3];
        }        
      
        tasks.forEach(imageTask => {
          imageTask.onSuccess = function(task) {
            console.log("Loaded", task.name);
          }
          imageTask.onError = function(task) {
            console.log("FAILED", task);
          }
        });

        assetsManager.onTaskSuccessObservable.add(function(task) {
            console.log('task successful', task)
        });
        
        // assetsManager.onFinish = () => {
        //     // sceene.init(canvas);
        //     console.log("Loading Finished!");
        //     // register renderloop
        //     scene.getEngine().runRenderLoop(() => { 
        //         scene.mainloop(scene.getEngine().getDeltaTime());
        //         scene.render();
        //     });
        // };

        assetsManager.onProgress = function(remainingCount, totalCount, lastFinishedTask) {
            let text = 'We are loading the scene. ' + remainingCount + ' out of ' + totalCount + ' items still need to be loaded.';
            console.log(text);
        };
        
        assetsManager.loadAsync();
        
    };
}

export { AssetManagement };