/**
 * Class that stores all environment-relevant, device-dependend information
 * Where are we running exactly our App? VR/ Mobile/ Desktop? Should be answered
 * also global settings like music / sound volume
 */
class Environment {
    constructor() {
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent);

        this.canvas = document.createElement("canvas");
        document.body.appendChild(this.canvas);
        this.canvas.height = window.innerHeight;
        this.canvas.width = window.innerWidth;
    }
}

export { Environment };
