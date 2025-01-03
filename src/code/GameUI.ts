import * as BABYLON from "@babylonjs/core";
import * as BABYLONGUI from "@babylonjs/gui";
import { Logging } from "./common/Logging";
import { Player } from "./Player";
import { GameEvent, GameEventHandler, GameEventType } from "./common/GameEvent";
export default class GameUI {

    playerHealth: BABYLONGUI.TextBlock;
    movement_button_pressed: boolean = false;

    // key-value store for debug values
    debug_values_textblock: BABYLONGUI.TextBlock;
    debug_values: Map<string, string> = new Map();

    constructor(engine: BABYLON.Engine, canvas: HTMLCanvasElement, player: Player, isMobile: boolean) {
        var fullScreenUI = BABYLONGUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
        var fullScreenDebugUI = BABYLONGUI.AdvancedDynamicTexture.CreateFullscreenUI("DebugUI");

        this.playerHealth = new BABYLONGUI.TextBlock();
        this.playerHealth.text = "\u2764 100";
        this.playerHealth.color = "white";
        this.playerHealth.fontSize = 45;
        this.playerHealth.textHorizontalAlignment = BABYLONGUI.TextBlock.HORIZONTAL_ALIGNMENT_LEFT;
        this.playerHealth.textVerticalAlignment = BABYLONGUI.TextBlock.VERTICAL_ALIGNMENT_TOP;
        this.playerHealth.horizontalAlignment = BABYLONGUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        this.playerHealth.verticalAlignment = BABYLONGUI.Control.VERTICAL_ALIGNMENT_TOP;
        this.playerHealth.paddingTop = 60;
        this.playerHealth.paddingLeft = 20;

        fullScreenUI.addControl(this.playerHealth);
        if(process.env.NODE_ENV === "development") {

            this.debug_values_textblock = new BABYLONGUI.TextBlock();
            this.debug_values_textblock.text = "Debug values";
            this.debug_values_textblock.color = "red";
            this.debug_values_textblock.textHorizontalAlignment = BABYLONGUI.TextBlock.HORIZONTAL_ALIGNMENT_LEFT;
            this.debug_values_textblock.textVerticalAlignment = BABYLONGUI.TextBlock.VERTICAL_ALIGNMENT_TOP;
            this.debug_values_textblock.horizontalAlignment = BABYLONGUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
            this.debug_values_textblock.verticalAlignment = BABYLONGUI.Control.VERTICAL_ALIGNMENT_TOP;
            this.debug_values_textblock.paddingTop = 120;
            this.debug_values_textblock.paddingLeft = 20;
            fullScreenDebugUI.addControl(this.debug_values_textblock);
        }
        // fullScreenDebugUI.layer!.isEnabled = false;

        // TODO image button for walking directionally
        // var button = BABYLONGUI.Button.CreateImageButton

        // TODO image button for jumping

        // TODO image button for sprinting

        // TODO image button for interacting? maybe dynamically shown

        if (isMobile) {
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
                    2 * (screen_x - button.centerX) / button._width.getValueInPixel(fullScreenUI, 100),
                    2 * (screen_y - button.centerY) / button._height.getValueInPixel(fullScreenUI, 100));
            }

            this.movement_button_pressed = false;

            button.onPointerDownObservable.add((eventData, eventState) => {
                this.movement_button_pressed = true;
                var relative_position = relative_position_in_button(eventData.x, eventData.y, button);
                player.mPhysics.handleMoveButtonInput(new BABYLON.Vector2(relative_position.x, -relative_position.y));
            });
            button.onPointerUpObservable.add((eventData, eventState) => {
                this.movement_button_pressed = false;
                player.mPhysics.handleMoveButtonInput(BABYLON.Vector2.Zero());
            });

            button.onPointerMoveObservable.add((eventData, eventState) => {
                if (this.movement_button_pressed) {
                    var relative_position = relative_position_in_button(eventData.x, eventData.y, button);
                    Logging.info("Relative position: ", relative_position);
                    player.mPhysics.handleMoveButtonInput(new BABYLON.Vector2(relative_position.x, -relative_position.y));
                    GameEventHandler.dispatchEvent(GameEventType.DebuggingShowValue, this, { key: "Relative position", value: relative_position.toString() });
                }
            });

            // Button zur AdvancedDynamicTexture hinzufügen
            fullScreenUI.addControl(button);
        }
        
        GameEventHandler.addGameEventsListener([GameEventType.PlayerHealthChanged, GameEventType.PlayerDied], this.onEvent.bind(this));
        GameEventHandler.addGameEventListener(GameEventType.DebuggingShowValue, this.onDebugValueShow.bind(this));
        GameEventHandler.addGameEventListener(GameEventType.DebuggingRemoveValue, this.onDebugValueRemove.bind(this));
    }


    onEvent = (gameEvent: GameEvent) => {
        let data = gameEvent.data as { health: string };
        this.playerHealth.text = "\u2764 " + data.health;
    }

    onDebugValueShow(gameEvent: GameEvent) {
        let data = gameEvent.data as { key: string, value: string };
        this.debug_values.set(data.key, data.value);
        this.update_debug_values();
    }

    onDebugValueRemove(gameEvent: GameEvent) {
        let data = gameEvent.data as { key: string, value: string };
        this.debug_values.delete(data.key);
        this.update_debug_values();
    }

    update_debug_values() {
        if (!this.debug_values_textblock) {
            return;
        }
        let text = "";
        this.debug_values.forEach((value, key) => {
            text += key + ": " + value + "\n";
        });
        this.debug_values_textblock.text = text;
    }

}




