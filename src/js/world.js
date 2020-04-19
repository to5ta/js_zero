export default class World {
    constructor(scene) {
        
        // Create the scene space
        this.scene = scene;

        this.gravity = -9.81;

        this.player_start_position = new BABYLON.Vector3(0,5,0);
        this.camera_start_position = new BABYLON.Vector3(30,30,30);

        // Add a camera to the scene and attach it to the canvas

        // Add lights to the scene
        var light1 = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(1, 1, 0), this.scene);
        light1.intensity = 0.1;
        // var light2 = new BABYLON.PointLight("light2", new BABYLON.Vector3(0, 1, -1), this.scene);
        var light2 = new BABYLON.DirectionalLight("light2", new BABYLON.Vector3(-1, -5, -1).normalize(), this.scene);
        light2.intensity = 0.3;


        this.collision_meshes = [];
        var ground_material = new BABYLON.StandardMaterial("ground_material", this.scene);
        ground_material.specularPower = 0;
        // ground_material.specularColor = new BABYLON.Color3(0,0,0);
        ground_material.roughness = 0.1;

        // Add and manipulate meshes in the scene
        this.plane = BABYLON.MeshBuilder.CreatePlane("Ground", {size: 30}, this.scene);
        this.plane.rotation.x = Math.PI / 2;
        this.plane.material = ground_material;
        this.plane.checkCollisions = true;
        this.collision_meshes.push(this.plane);

        this.box = BABYLON.MeshBuilder.CreateBox("GroundBox", {size: 2}, this.scene);
        this.box.position = new BABYLON.Vector3(0, 0.5, 5);
        this.box.checkCollisions = true;
        this.box.material = ground_material;
        this.collision_meshes.push(this.box);


        var envTexture = new BABYLON.CubeTexture("./sky", this.scene);
        this.scene.createDefaultSkybox(envTexture, false, 1000);
      
    }
}
