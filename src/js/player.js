var BABYLON = require('babylonjs');



class Player {
    constructor() {
        this.falling = false;

        this.onEvent = (event) => {
            console.log(event);
        }
    }

    attachControl( element ) {
        element.addEventListener("keydown", this.onEvent);
    }

    detachControl( element ) {
        element.removeEventListener("keydown", this.onEvent);
    }

}




export { Player };
