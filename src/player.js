var THREE = require('three');
var CANNON = require('cannon');

class Player {
    constructor(world) {
        // var geometry = new THREE.BoxGeometry( 1,1,1 );
        var geometry = new THREE.SphereGeometry(0.5);
        var material = new THREE.MeshBasicMaterial( { color:  0xff0000 } );
        this.model = new THREE.Mesh( geometry, material );
        this.model.position.y = 3;
        world.scene.add( this.model );
        this.falling = false;

        let mat = new CANNON.Material("capsuleMat");
            mat.friction = 0.1;

        this.physicalCapsule = new CANNON.Body({
            mass: 1,
            position: new CANNON.Vec3(0.0, 3.0, 0.0)
        });

        this.physicalCapsule.addEventListener('collide', this);

        // Compound shape
        // let sphereShape = new CANNON.Box(new CANNON.Vec3(0.5,0.5,0.5));
        let sphereShape = new CANNON.Sphere(0.5);

        // Materials
        this.physicalCapsule.material = mat;

        this.physicalCapsule.fixedRotation = true;
        
        this.physicalCapsule.addShape(sphereShape, new CANNON.Vec3(0, 0, 0));
        
        world.physical_world.addBody(this.physicalCapsule);

    }

    // needed for dispatching the collsion event on that class
    call(object, event) {
        this.falling = false;
    }

    // handleEvent(event) {
    // }

    applyForce(cannon_vec) {
        // this.physicalCapsule.force = cannon_vec.scale(100);
        this.physicalCapsule.velocity = cannon_vec.scale(3);

    }

    infoString() {
        var info = "";
        info += "Force: " + this.physicalCapsule.force.toString();
        info += "Veloctiy: " + this.physicalCapsule.velocity.toString();
        return info;
    }

    jump() {
        if(this.falling == false) {
            this.falling = true;
            this.physicalCapsule.velocity.y = 10;
        }
    }

    update(){
        this.model.position.copy(this.physicalCapsule.position);
        this.model.quaternion.copy(this.physicalCapsule.quaternion);
    }
}

export { Player };