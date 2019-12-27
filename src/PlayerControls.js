var THREE = require('three');

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

class PlayerControls {
    constructor( player, camera, dom_Element ){
        this.player = player;
        this.camera = camera;
        this.dom_Element = dom_Element;

        this.orbit_controls = new OrbitControls( this.camera, dom_Element );
        this.orbit_controls.enablePan = false;
        this.orbit_controls.target.y = 2;
        this.orbit_controls.maxPolarAngle = Math.PI/2 - 0.1;
        this.orbit_controls.enablePan = false;

        this.camera.position.z = 9;
        this.camera.position.y = 3;
        
        this.camera.rotation.x = -0.3;
    }

    handleEvent( event ) {
        console.log(event.keyCode);
        var delta_position = new THREE.Vector3();
        if(event.key == "ArrowLeft" || event.key == "a" || event.key == "A" ) {
          delta_position.x = -1;
        }
        if(event.key == "ArrowRight" || event.key == "d" || event.key == "D") {
          delta_position.x = 1;
        }
        if(event.key == "ArrowUp" || event.key == "w" || event.key == "W") {
          delta_position.z = -1;
        }
        if(event.key == "ArrowDown" || event.key == "s" || event.key == "S") {
          delta_position.z = 1;
        }

        if([37, 38, 39, 40, 87, 65, 83, 68].includes(event.keyCode)){
          this.player.model.position.add(
            delta_position.transformDirection(this.player.model.matrixWorld).multiplyScalar(0.25)
          );
        } 
    }
}

export { PlayerControls };