/**
 * Class that stores all environment-relevant, device-dependend information
 * Where are we running exactly our App? VR/ Mobile/ Desktop? Should be answered
 */
class Environment {
    constructor() {
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent);
    }
}

export { Environment };