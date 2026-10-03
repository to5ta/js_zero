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
    leftJoystick: BABYLON.VirtualJoystick;
    rightJoystick: BABYLON.VirtualJoystick;
    
    private boundOnEvent: (gameEvent: GameEvent) => void;
    private boundOnDebugValueShow: (gameEvent: GameEvent) => void;
    private boundOnDebugValueRemove: (gameEvent: GameEvent) => void;
    
    constructor(engine: BABYLON.Engine, canvas: HTMLCanvasElement, player: Player, isMobile: boolean) {
        var fullScreenUI = BABYLONGUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
        var fullScreenDebugUI = BABYLONGUI.AdvancedDynamicTexture.CreateFullscreenUI("DebugUI");
        
        this.playerHealth = new BABYLONGUI.TextBlock();
        this.playerHealth.text = "\u2764 100";
        this.playerHealth.color = "white";
        if (isMobile) {
            this.playerHealth.fontSize = 30;
        } else {
            this.playerHealth.fontSize = 45;
        }
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
        
        if (isMobile) {
            // virtual joystick
            this.leftJoystick = new BABYLON.VirtualJoystick(true);
            this.rightJoystick = new BABYLON.VirtualJoystick(false);
            // set z
            this.leftJoystick.setJoystickSensibility(0.1);
            BABYLON.VirtualJoystick.Canvas!.style.zIndex = "4";
            
            // set color
            this.leftJoystick.setJoystickColor("rgba(0, 255, 0, 0.5)");
            this.rightJoystick.setJoystickColor("rgba(255, 0, 0, 0.5)");

            // set sensitivity
            this.leftJoystick.setJoystickSensibility(50);
            this.leftJoystick.containerSize = 100;
            this.rightJoystick.setJoystickSensibility(50);
            this.rightJoystick.containerSize = 100;


            // set limit
            this.leftJoystick.limitToContainer = true;
        }
        
        this.boundOnEvent = this.onEvent.bind(this);
        this.boundOnDebugValueShow = this.onDebugValueShow.bind(this);
        this.boundOnDebugValueRemove = this.onDebugValueRemove.bind(this);
        
        GameEventHandler.addGameEventsListener([GameEventType.PlayerHealthChanged, GameEventType.PlayerDied], this.boundOnEvent);
        GameEventHandler.addGameEventListener(GameEventType.DebuggingShowValue, this.boundOnDebugValueShow);
        GameEventHandler.addGameEventListener(GameEventType.DebuggingRemoveValue, this.boundOnDebugValueRemove);
    }
    
    handleMobileInput(player: Player) {
        if (this.leftJoystick.pressed) {
            // get joystick values
            let left = this.leftJoystick.deltaPosition;
            
            // move player
            player.mPhysics.handleDirectionalMovementInput(new BABYLON.Vector2(left.x, left.y));
            
            // set rotation based on direction
            var anzimuth = Math.atan2(left.x, left.y);

            player.setOrientation(anzimuth);
            
        } else {
            player.mPhysics.handleDirectionalMovementInput(new BABYLON.Vector2(0, 0));
        }

        if (this.rightJoystick.pressed) {
            var right = this.rightJoystick.deltaPosition;
            player.camera.alpha -= right.x / 25;
            player.camera.beta -= right.y / 150;
            // player.setOrientation(player.camera.alpha);
        }
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

    dispose() {
        // Cleanup event listeners
        GameEventHandler.removeGameEventListener(GameEventType.PlayerHealthChanged, this.boundOnEvent);
        GameEventHandler.removeGameEventListener(GameEventType.PlayerDied, this.boundOnEvent);
        GameEventHandler.removeGameEventListener(GameEventType.DebuggingShowValue, this.boundOnDebugValueShow);
        GameEventHandler.removeGameEventListener(GameEventType.DebuggingRemoveValue, this.boundOnDebugValueRemove);
        
        // Dispose joysticks
        if (this.leftJoystick) {
            this.leftJoystick.releaseCanvas();
        }
        if (this.rightJoystick) {
            this.rightJoystick.releaseCanvas();
        }
    }
}




