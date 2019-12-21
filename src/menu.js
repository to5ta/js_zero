import { Environment } from "./environment";

import './style.css'

class Menu {
    constructor(env) {
        this.background = document.createElement("div");
        this.background.setAttribute('class', 'menu_background');
        this.background.style.visibility = "true";

        this.continue_button = document.createElement("div");
        this.continue_button.setAttribute('class', 'menu_button');
        
        this.continue_button_text = document.createElement("p");
        this.continue_button_text.textContent = "Continue";
        this.continue_button.addEventListener("click", this);
        this.background.appendChild(this.continue_button);
        this.continue_button.appendChild(this.continue_button_text);

        document.body.appendChild(this.background);
        
    }

    handleEvent(event) {
        console.log("handle event:", event);
        console.log("this:", this);
        if(event.type == "click"){
            console.log(this);
            this.background.style.cssText = "display: none;";
        }
    }

    show() {
        this.background.style.cssText = "display: initial;";
    }
}

export { Menu };