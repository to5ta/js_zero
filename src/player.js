var THREE = require('three');
var CANNON = require('cannon');

class Player {
    constructor(world) {
        this.falling = false;

        this.MAX_SPEED = 5;
        this.ACCELERATION = 10;

        
        // var geometry = new THREE.BoxGeometry( 1,1,1 );
        var geometry = new THREE.SphereGeometry(0.5);
        var material = new THREE.MeshBasicMaterial( { color:  0xff0000 } );
        this.model = new THREE.Mesh( geometry, material );
        this.model.position.y = 3;


        var wireframe = new THREE.WireframeGeometry( geometry );

        var line = new THREE.LineSegments( wireframe );
        line.material.depthTest = false;
        line.material.opacity = 0.25;
        line.material.transparent = true;


        this.model.add( line );



        world.scene.add( this.model );


        // physics setup /////////////////////////////////////////////////////////////////////////
        let mat = new CANNON.Material("capsuleMat");
            mat.friction = 0.02;

        this.physicalBody = new CANNON.Body({
            mass: 0.1,
            position: new CANNON.Vec3(0.0, 3.0, 0.0)
        });

        this.physicalBody.addEventListener('collide', this);

        // Compound shape
        // let sphereShape = new CANNON.Box(new CANNON.Vec3(0.5,0.5,0.5));
        let sphereShape = new CANNON.Sphere(0.5);

        // Materials
        this.physicalBody.material = mat;
        this.physicalBody.fixedRotation = true;
        this.physicalBody.addShape(sphereShape, new CANNON.Vec3(0, 0, 0));
        world.physical_world.addBody(this.physicalBody);
        
    }   

    // needed for dispatching the collsion event on that class
    call(object, event) {
        this.falling = false;
    }

    move(movement_vector) {
        var dAcc = 1 - (this.physicalBody.velocity.norm() / this.MAX_SPEED);
        this.physicalBody.force.x = (movement_vector.x) * this.ACCELERATION * dAcc;
        this.physicalBody.force.z = movement_vector.z * this.ACCELERATION * dAcc;
    }

    infoString() {
        var info = "";
        info += "Veloctiy: <br/>";
        info += "x: "+this.physicalBody.velocity.x.toFixed(2) + "<br/>";
        info += "y: "+this.physicalBody.velocity.y.toFixed(2) + "<br/>";
        info += "z: "+this.physicalBody.velocity.z.toFixed(2) + "<br/>";
        return info;
    }

    jump() {
        if(this.falling == false) {
            this.falling = true;
            this.physicalBody.velocity.y = 10;
        }
    }

    update(){
        this.model.position.copy(this.physicalBody.position);
        this.model.quaternion.copy(this.physicalBody.quaternion);
    }
}

export { Player };