import * as BABYLON from "@babylonjs/core";
import { ILoadingScreen } from "@babylonjs/core/Loading";

import promoStartScreen from "./../promotion/promo6.jpg";

import "./styles.css";

import { Div, Text, Img } from "./html_utils";
class CustomLoadingScreen implements ILoadingScreen {
    updateProgress(remaining: number, total: number, task: BABYLON.AbstractAssetTask): any {
        let percentage = Math.round(((total-remaining) / total) * 100);
        if (this.title) {
            this.title.textContent = `Loading Game... ${percentage}%`;
            this.titleImage.style.filter = `grayscale(${100-percentage}%)`;
        }
    }
    
    background:     HTMLDivElement;
    title:          HTMLDivElement;
    startButton:    HTMLDivElement;
    titleImage:     HTMLImageElement;
    
    constructor(){
        this.title = Text();
        this.title.id = "loadingtitle";
        this.title.textContent = "Loading Game...";
        
        this.background = Div();
        this.background.id = "loading_screen_background";
        this.background.className = "background";
        this.background.appendChild(this.title);
        
        this.titleImage = Img();
        this.titleImage.src = promoStartScreen;
        this.titleImage.id = "titleImage"; 
        this.titleImage.style.filter = `grayscale(100%)`;
        this.titleImage.style.borderRadius = "100px";

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
        }, 1510);
    }
}

export { CustomLoadingScreen };