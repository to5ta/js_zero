/**
 * Class that stores all environment-relevant, device-dependend information
 * Where are we running exactly our App? VR/ Mobile/ Desktop? Should be answered
 * also global settings like music / sound volume
*/

import { Logging } from "./common/Logging";

class Environment {
    static isMobile: boolean;
    static canvas: HTMLCanvasElement;

    static init() {
        Environment.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent);

        Environment.canvas = document.createElement("canvas");
        Environment.canvas.height = window.innerHeight;
        Environment.canvas.width = window.innerWidth;
        Logging.info(Environment.canvas);
        Logging.info(window);
        document.body.appendChild(Environment.canvas);
    }

}

export { Environment };
