var THREE = require('three');

import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';

class DebugControls {
    constructor( camera, dom_Element ){
        this.camera = camera;
        this.dom_Element = dom_Element;

        this.pointerlock_controls = new PointerLockControls( this.camera, dom_Element );
        this.camera.position.y = 3;
        this.camera.position.z = 9;
    
    }

    lock() {
        this.pointerlock_controls.lock();
    }

    unlock() {
        this.pointerlock_controls.unlock();
    }

    handleEvent(event){
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
        if( event.key == "q" || event.key == "Q") {
          delta_position.y = 1;
        }
        if( event.key == "e" || event.key == "E") {
          delta_position.y = -1;
        }

        if([37,38,39,40, 81, 87, 69, 65, 83, 68].includes(event.keyCode)){
          this.camera.position.add(
            delta_position.transformDirection(this.camera.matrixWorld).multiplyScalar(0.25)
          );
        } 
    }
}

export { DebugControls };