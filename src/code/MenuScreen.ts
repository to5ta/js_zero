import { Game } from "./game";

import "./styles.css";

import { Logging } from "./common/Logging";

import { Div, Text, Img } from "./html_utils";
class MenuScreen {
    game: Game;
    background: HTMLDivElement;

    constructor(game: Game) {
        this.game = game;

        this.background = Div();
        this.background.className = "background";
        this.background.id = "menu_background";
        this.background.style.zIndex = "100";
        document.body.appendChild(this.background);

        const createButton = (id: string, text: string, onClick: () => void) => {
            const button = Div();
            button.id = id;
            button.className = "button";
            button.textContent = text;
            button.onclick = onClick;
            this.background.appendChild(button);
        };

        createButton("start_button", "Start", () => {
            Logging.info("clicked");
            this.game.start();
            this.hide();
        });

        createButton("save_button", "Save", () => {});
        createButton("load_button", "Load", () => {});
        createButton("help_button", "Help", () => {});
        createButton("credits_button", "Credits", () => {});
        createButton("quit_button", "Quit", () => { 
            window.close();
        });


    }
    show() {
        this.background.hidden = false;
    }

    hide() {
        this.background.hidden = true;        
    }
}

export { MenuScreen };