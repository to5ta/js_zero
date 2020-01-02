var THREE = require('three');
var CANNON = require('cannon');

class World {
    constructor() {
        this.scene = new THREE.Scene();


        // Setup our world
        this.physical_world = new CANNON.World();
        this.physical_world.gravity.set(0, -9.82, 0); // m/s²

        let mat = new CANNON.Material("groundMat");
        mat.friction = 1000.3;

        // Create a plane
        var groundBody = new CANNON.Body({
            mass: 0 // mass == 0 makes the body static
        });

        groundBody.material = mat;
        
        var gorundBox = new CANNON.Box(new CANNON.Vec3(10, 1, 10));
        console.log(gorundBox)

        groundBody.addShape(gorundBox, new CANNON.Vec3(0,-1,0));
        this.physical_world.addBody(groundBody);
        
        var size = 10;
        var divisions = 10;
        var gridHelper = new THREE.GridHelper( size, divisions, 0x888888, 0x404040 );
        gridHelper.position.y = 0.1;
        this.scene.add( gridHelper );
        // gridHelper.visible = false;
    
        var geometry = new THREE.PlaneGeometry( 5,5,5 );
        var material = new THREE.MeshBasicMaterial( { color:  0x222222 } );
        var ground = new THREE.Mesh( geometry, material );
        ground.rotation.x = - Math.PI / 2;

        this.scene.add( ground );
    }

    update(dt) {
        var fixedTimeStep = 1.0 / 60.0; // seconds
        var maxSubSteps = 3;
        this.physical_world.step(fixedTimeStep, dt, maxSubSteps);
    }
}

export { World };