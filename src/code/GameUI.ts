import * as BABYLON from "@babylonjs/core";
import * as BABYLONGUI from "@babylonjs/gui";
import { Logging } from "./common/Logging";

export default class GameUI {

    playerHealth: BABYLONGUI.TextBlock;

    constructor() {
        var advancedTexture = BABYLONGUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

        this.playerHealth = new BABYLONGUI.TextBlock();
        this.playerHealth.text = "Hello world";
        this.playerHealth.color = "white";
        this.playerHealth.fontSize = 45;
        this.playerHealth.textHorizontalAlignment = BABYLONGUI.TextBlock.HORIZONTAL_ALIGNMENT_LEFT;
        this.playerHealth.textVerticalAlignment = BABYLONGUI.TextBlock.VERTICAL_ALIGNMENT_TOP;
        this.playerHealth.horizontalAlignment = BABYLONGUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        this.playerHealth.verticalAlignment = BABYLONGUI.Control.VERTICAL_ALIGNMENT_TOP;
        this.playerHealth.paddingTop = 60;
        this.playerHealth.paddingLeft = 20;

        advancedTexture.addControl(this.playerHealth);   
        
        // TODO image button for walking directionally
        // var button = BABYLONGUI.Button.CreateImageButton

        // TODO image button for jumping

        // TODO image button for sprinting

        // TODO image button for interacting? maybe dynamically shown

        var button = BABYLONGUI.Button.CreateSimpleButton("button", "Klick mich");
        button.width = "150px";
        button.height = "40px";
        button.color = "white";
        button.background = "green";

        // get screen size from document
        var width = window.innerWidth;
        var height = window.innerHeight;
        Logging.info("Screen size: ", width, height);


        function callback_factory(msg: string) {
            return (eventData: BABYLONGUI.Vector2WithInfo, eventState: BABYLON.EventState) => {
                Logging.info(msg)
                Logging.info(eventData, eventState)
                // Fügen Sie hier die Logik hinzu, die ausgeführt werden soll, wenn auf den Button geklickt wird
        } 
        }

        button.onPointerDownObservable.add(callback_factory("Button Down"));
        button.onPointerUpObservable.add(callback_factory("Button up"));
        button.onPointerClickObservable.add(callback_factory("Pointer Clicked up"));

        button.onPointerClickObservable.add();

        // Button zur AdvancedDynamicTexture hinzufügen
        advancedTexture.addControl(button);
    }
}



