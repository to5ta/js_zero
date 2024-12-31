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

        const createButton = (id: string, text: string, onClick: () => void, disabled = false) => {
            const button = Div();
            button.id = id;
            button.className = "button";
            if (disabled) {
                button.style.opacity = "0.5";
                button.style.pointerEvents = "none";
                button.style.cursor = "not-allowed";
            }
            button.textContent = text;
            button.onclick = onClick;
            this.background.appendChild(button);
        };

        createButton("start_button", "Start", () => {
            Logging.info("clicked");
            this.game.start();
            this.hide();
        });

        createButton("save_button", "Save", () => {}, true);
        createButton("load_button", "Load", () => {}, true);
        createButton("help_button", "Help", () => {}, true);
        createButton("credits_button", "Credits", () => {}, true);
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