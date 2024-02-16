import * as BABYLON from "@babylonjs/core";
import * as BABYLONGUI from "@babylonjs/gui";
import { Logging } from "./common/Logging";
import {Player} from "./Player";
export default class GameUI {

    playerHealth: BABYLONGUI.TextBlock;
    movement_button_pressed : boolean = false;

    constructor(engine: BABYLON.Engine, canvas: HTMLCanvasElement, player: Player, isMobile: boolean) {
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

        if (isMobile){
        var button = BABYLONGUI.Button.CreateSimpleButton("Knopf", "<Move>");
        button.width = "150px";
        button.height = "150px";
        button.color = "white";
        button.background = "green";
        button.cornerRadius = 20;
        button.alpha = 0.3;

        
        // get screen size from document
        var width = window.innerWidth;
        var height = window.innerHeight;
        button.left = 0;
        button.top = engine.getRenderHeight() / 4;
        Logging.info("Screen size: ", width, height);

        function relative_position_in_button(screen_x: number, screen_y: number, element: BABYLONGUI.Button) {
            return new BABYLON.Vector2(
                2*(screen_x-button.centerX) / button._width.getValueInPixel(advancedTexture, 100),
                2*(screen_y-button.centerY) / button._height.getValueInPixel(advancedTexture, 100));
        }

        this.movement_button_pressed = false;

        button.onPointerDownObservable.add((eventData, eventState) => {
            this.movement_button_pressed = true;
        });
        button.onPointerUpObservable.add((eventData, eventState) => {
            this.movement_button_pressed = false;
            player.mPhysics.handleDirectionalMovementInput(BABYLON.Vector2.Zero());
        });
        button.onPointerMoveObservable.add((eventData, eventState) => {
            if (this.movement_button_pressed) {
                // Logging.info("Pointer Move", eventData, eventState);
                var relative_position = relative_position_in_button(eventData.x, eventData.y, button);
                player.mPhysics.handleDirectionalMovementInput(new BABYLON.Vector2(relative_position.x, -relative_position.y));
            }
        });
        // button.onPointerClickObservable.add(callback_factory("Pointer Clicked up"));

        // Button zur AdvancedDynamicTexture hinzufügen
        advancedTexture.addControl(button);
}    }
}



