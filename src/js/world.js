import sky_px from "../assets/textures/skybox/sky_px.jpg";
import sky_nx from "../assets/textures/skybox/sky_nx.jpg";
import sky_py from "../assets/textures/skybox/sky_py.jpg";
import sky_ny from "../assets/textures/skybox/sky_ny.jpg";
import sky_pz from "../assets/textures/skybox/sky_pz.jpg";
import sky_nz from "../assets/textures/skybox/sky_nz.jpg";

export default class World {
    constructor(scene) {
        
        // Create the scene space
        this.scene = scene;

        // Add a camera to the scene and attach it to the canvas

        // Add lights to the scene
        var light1 = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(1, 1, 0), this.scene);
        light1.intensity = 0.1;
        // var light2 = new BABYLON.PointLight("light2", new BABYLON.Vector3(0, 1, -1), this.scene);
        var light2 = new BABYLON.DirectionalLight("light2", new BABYLON.Vector3(-1, -5, -1).normalize(), this.scene);
        light2.intensity = 0.3;

        var ground_material = new BABYLON.StandardMaterial("ground_material", this.scene);
        ground_material.specularPower = 0;
        // ground_material.specularColor = new BABYLON.Color3(0,0,0);
        ground_material.roughness = 0.1;

        // Add and manipulate meshes in the scene
        var plane = BABYLON.MeshBuilder.CreatePlane("Ground", {size: 30}, this.scene);
        plane.rotation.x = Math.PI / 2;
        plane.material = ground_material;
        
        var box = BABYLON.MeshBuilder.CreateBox("GroundBox", {size: 1}, this.scene);
        box.position = new BABYLON.Vector3(0,0.5, 3);
        box.material = ground_material;

        var assetsManager = new BABYLON.AssetsManager(this.scene);

        var imageTasks = [];

        imageTasks.push(assetsManager.addImageTask("sky_px", sky_px));
        imageTasks.push(assetsManager.addImageTask("sky_nx", sky_nx));
        imageTasks.push(assetsManager.addImageTask("sky_py", sky_py));
        imageTasks.push(assetsManager.addImageTask("sky_ny", sky_ny));
        imageTasks.push(assetsManager.addImageTask("sky_pz", sky_pz));
        imageTasks.push(assetsManager.addImageTask("sky_nz", sky_nz)); 
        
        imageTasks.forEach(imageTask => {
          imageTask.onSuccess = function(task) {
            console.log("Loaded", task.name);
          }
          imageTask.onError = function(task) {
            console.log("FAILED", task);
          }
        });
        assetsManager.load();
    
        var envTexture = new BABYLON.CubeTexture("./sky", this.scene);
        this.scene.createDefaultSkybox(envTexture, false, 1000);
      
    }
}
