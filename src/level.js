var THREE = require('three');


class Level {
    constructor() {
        this.scene = new THREE.Scene();
        
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
}

export { Level };