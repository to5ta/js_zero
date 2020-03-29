
class World {
    constructor(scene) {
        
        // Create the scene space
        this.scene = scene;

        // Add a camera to the scene and attach it to the canvas

        // Add lights to the scene
        var light1 = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(1, 1, 0), this.scene);
        light1.intensity = 0.1;
        // var light2 = new BABYLON.PointLight("light2", new BABYLON.Vector3(0, 1, -1), this.scene);
        var light2 = new BABYLON.DirectionalLight("light2", new BABYLON.Vector3(-1, -5, -1).normalize(), this.scene);
        light2.intensity = 0.1;

        var ground_material = new BABYLON.StandardMaterial("ground_material", this.scene);
        ground_material.specularPower = 0;
        // ground_material.specularColor = new BABYLON.Color3(0,0,0);
        ground_material.roughness = 0.1;

        // Add and manipulate meshes in the scene
        var plane = BABYLON.MeshBuilder.CreatePlane("Ground", {size: 10}, this.scene);
        plane.rotation.x = Math.PI / 2;
        plane.material = ground_material;
        
        var box = BABYLON.MeshBuilder.CreateBox("GroundBox", {size: 1}, this.scene);
        box.position = new BABYLON.Vector3(0,0.5, 3);
        box.material = ground_material;
    }
}

export { World };