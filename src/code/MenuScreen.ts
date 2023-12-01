import { Game } from "./game";

import "./LoadingScreenStyle.css";

class MenuScreen {
    game: Game;   
    background: HTMLDivElement;

    constructor(game: Game) {
        this.game = game;
        // red div that fills the whole screen
        let background = document.createElement('div');
        background.style.backgroundColor = "red";

        background.style.margin  = "0px";
        background.style.overflow  = "hidden";
        background.style.display  = "block";
        background.style.position = "absolute";
        background.style.top      = "0px";
        background.style.left     = "0px";
        background.style.width    = "100%";
        background.style.height   = "100%";
        this.background = background;

        background.onclick = () => {
            console.log("clicked");
            this.game.start();
            this.background.style.opacity = "0";

        }
        
        background.id = "menu_screen_background";
        document.body.appendChild(background);
    }

}

export { MenuScreen };