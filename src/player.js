var THREE = require('three');

class Player {
    constructor() {
        var geometry = new THREE.BoxGeometry( 0.4, 2, 0.4 );
        var material = new THREE.MeshBasicMaterial( { color:  0xff0000 } );
        this.model = new THREE.Mesh( geometry, material );
        this.model.position.y = 1;

    }
    
    handleEvent(event) {

    }
}

export { Player };