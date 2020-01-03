var THREE = require('three');
var CANNON = require('cannon');

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

class PlayerControls {
    constructor( player, camera, dom_Element ){
        this.player = player;
        this.camera = camera;
        this.dom_Element = dom_Element;

        this.theta = 0;
        this.phi = 0;
        this.sensitivity = new THREE.Vector2(1, 1);

        
        this.lastMouseX = 0;
        this.lastMouseY = 0;

        this.mouse_dragging = false;

        this.euler_rotation = new THREE.Euler(0,0,0,"YXZ");
        this.forward_direction = new THREE.Vector3(0,0,-1);
        this.right_direction = new THREE.Vector3(1,0,0);

        this.camera.position.z = 9;
        this.camera.position.y = 3;
        this.camera.rotation.x = -0.3;

        this.distance_to_player = 10;

        this.camera.lookAt(this.player.model.position);

        this.forwardArrowHelper = new THREE.ArrowHelper( this.forward, new THREE.Vector3(), 3, 0xff0000 );
        this.player.model.add(this.forwardArrowHelper);
        
        this.rightArrowHelper = new THREE.ArrowHelper( this.forward, new THREE.Vector3(), 3, 0x00ff00 );
        this.player.model.add(this.rightArrowHelper);

        this.moveArrowHelper = new THREE.ArrowHelper( this.forward, new THREE.Vector3(), 2, 0xffffff );
        this.player.model.add(this.moveArrowHelper);

    }

    onMouseDown( event ) {
      this.mouse_dragging = true;
    }

    onMouseUp (event ) {
      this.mouse_dragging = false;
    }

    onMouseWheel( event ) {
      this.distance_to_player += event.deltaY;
    }

    onMouseMove( event ){
      var deltaX = event.x - this.lastMouseX;
      var deltaY = event.y - this.lastMouseY;
      this.lastMouseX = event.x;
      this.lastMouseY = event.y;

      if( this.mouse_dragging ) {
        this.theta -= deltaX * (this.sensitivity.x / 2);
        this.theta %= 360;
        this.phi += deltaY * (this.sensitivity.y / 2);
        this.phi = Math.min(85, Math.max(-85, this.phi));

      }
      this.updateCamera();
      this.updateDirection();
    }


    updateDirection(){
      this.euler_rotation.y = this.theta/180 * Math.PI;

      this.forward_direction.x = 0;
      this.forward_direction.y = 0;
      this.forward_direction.z = -1;
      this.forward_direction.applyEuler( this.euler_rotation );
      this.forwardArrowHelper.setDirection(this.forward_direction); 

      this.right_direction.x = 1;
      this.right_direction.y = 0;
      this.right_direction.z = 0;
      this.right_direction.applyEuler( this.euler_rotation );
      this.rightArrowHelper.setDirection(this.right_direction); 
    }

    updateCamera() {
      this.target = this.player.model.position;
      this.camera.position.x = this.target.x + this.distance_to_player * Math.sin(this.theta * Math.PI / 180) * Math.cos(this.phi * Math.PI / 180);
      this.camera.position.y = this.target.y + this.distance_to_player * Math.sin(this.phi * Math.PI / 180);
      this.camera.position.z = this.target.z + this.distance_to_player * Math.cos(this.theta * Math.PI / 180) * Math.cos(this.phi * Math.PI / 180);
      this.camera.updateMatrix();
      this.camera.lookAt(this.target);
    }

    infoString(){
      var info = "";
      info += "Theta: " + this.theta.toFixed(3);
      return info;
    }

    handleKeyPress( event ) {
        var delta_position = new THREE.Vector3(0,0,0);
        
        if(event.key == "ArrowLeft" || event.key == "a" || event.key == "A" ) {
          delta_position.sub(this.right_direction);
        }
        if(event.key == "ArrowRight" || event.key == "d" || event.key == "D") {
          delta_position.add(this.right_direction);
        }
        if(event.key == "ArrowUp" || event.key == "w" || event.key == "W") {
          delta_position.add(this.forward_direction);
        }
        if(event.key == "ArrowDown" || event.key == "s" || event.key == "S") {
          delta_position.sub(this.forward_direction);
        }

        if(event.keyCode == 32) {
          this.player.jump();
        }

        if([37, 38, 39, 40, 87, 65, 83, 68].includes(event.keyCode)){
            delta_position.normalize();
            this.moveArrowHelper.setDirection(delta_position);
            this.player.move(delta_position);
            // this.updateDirection();
        } 
    }
}

export { PlayerControls };