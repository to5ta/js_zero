import { ILoadingScreen } from "@babylonjs/core/Loading";

import promoStartScreen from "./../../promotion/promo6.jpg";

import "./LoadingScreenStyle.css";

function Div(): HTMLDivElement {
    return document.createElement('div');
}

function Text(): HTMLDivElement {
    return document.createElement('p');
}

function Img(): HTMLImageElement {
    return document.createElement("img");
}
class CustomLoadingScreen implements ILoadingScreen {
    
    background: HTMLDivElement;
    title: HTMLDivElement;
    startButton: HTMLDivElement;
    titleImage: HTMLImageElement;

    constructor(){
        this.background = Div();
        this.background.id = "loading_screen_background";

        this.title = Text();
        this.title.id = "loadingtitle";
        this.title.textContent = "Loading Game...";
        this.background.appendChild(this.title);

        this.startButton = Div();
        this.titleImage = Img();
        this.titleImage.src = promoStartScreen;
        this.titleImage.id = "titleImage"; 
        this.background.appendChild(this.titleImage);
    }

    loadingUIBackgroundColor: string;
    loadingUIText: string;

    displayLoadingUI() {
        document.body.appendChild(this.background);
    }

    hideLoadingUI() {
        setTimeout(()=>{
            this.background.style.animationPlayState = "running";
            this.titleImage.style.animationPlayState = "running";
            this.title.textContent ="";
        }, 1500);
        setTimeout(()=> {
            document.body.removeChild(this.background);
        }, 4500);
    }
}

export { CustomLoadingScreen };