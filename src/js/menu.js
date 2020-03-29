import { Environment } from "./environment";

require('../css/style.css');

class Menu {
    constructor(env) {
        this.hidden = true;
        this.env = env;
        this.background = document.createElement("div");
        this.background.setAttribute('class', 'menu_background');
        this.background.style.visibility = "true";

        this.continue_button = document.createElement("div");
        this.continue_button.setAttribute('class', 'menu_button');
        this.continue_button.setAttribute('id', 'continue_button');
        
        this.continue_button.textContent = "Continue";
        this.continue_button.addEventListener("click", this);

        this.background.appendChild(this.continue_button);

        document.body.appendChild(this.background);

        this.menu_opener = document.createElement("div");
        this.menu_opener.setAttribute('id', 'menu_opener');
        this.menu_opener.addEventListener("click", this);

        this.debug_text = document.createElement("p");
        this.menu_opener.setAttribute('id', "debug_text");
        document.body.appendChild(this.debug_text);

        if(this.env.isMobile == false) {
            this.menu_opener.style.cssText = "display: none;";
        }

        document.body.appendChild(this.menu_opener);

        document.body.addEventListener("keydown", (event) => {
            if(event.key == "Escape") {
                if(this.hidden) {
                    this.show();
                } else {
                    this.hide();
                }
            }
        });
        
        this.hide();
    }

    handleEvent(event) {
        console.log("event target:", event.target);
        if(event.target.id == "continue_button"){
            this.hide();
        }
        if(event.target.id == "menu_opener"){
            this.show();
        }
    }

    show() {
        this.hidden = false;
        this.background.style.cssText = "display: initial;";
        if(this.env.isMobile) {
            this.menu_opener.style.cssText = "display: none;";
        }
    }

    hide() {
        this.hidden = true;
        this.background.style.cssText = "display: none;";
        if(this.env.isMobile) {
            this.menu_opener.style.cssText = "display: initial;";
        }
    }
}

export { Menu };