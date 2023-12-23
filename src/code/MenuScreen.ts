import { Game } from "./game";

import "./styles.css";

import { Div, Text, Img } from "./html_utils";
class MenuScreen {
    game: Game;
    background: HTMLDivElement;

    constructor(game: Game) {
        this.game = game;

        let background = Div();
        this.background = background;
        this.background.className = "background";
        this.background.id = "menu_background";
        this.background.style.zIndex = "100";
        document.body.appendChild(this.background);

        let start_button = Div();
        start_button.id = "start_button";
        start_button.className = "button";
        start_button.textContent = "Start";
        background.appendChild(start_button);

        start_button.onclick = () => {
            console.log("clicked");
            this.game.start();
            this.hide();
        }
    }
    show() {
        this.background.hidden = false;
    }

    hide() {
        this.background.hidden = true;        
    }
}

export { MenuScreen };