import * as BABYLON from "@babylonjs/core";
import * as BABYLONGUI from "@babylonjs/gui";

export default class GameUI {

    playerHealth: BABYLONGUI.TextBlock;

    constructor() {
    var advancedTexture = BABYLONGUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

    this.playerHealth = new BABYLONGUI.TextBlock();
    this.playerHealth.text = "Hello world";
    this.playerHealth.color = "white";
    this.playerHealth.fontSize = 35;
    this.playerHealth.textHorizontalAlignment = BABYLONGUI.TextBlock.HORIZONTAL_ALIGNMENT_LEFT;
    this.playerHealth.textVerticalAlignment = BABYLONGUI.TextBlock.VERTICAL_ALIGNMENT_TOP;
    this.playerHealth.horizontalAlignment = BABYLONGUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
    this.playerHealth.verticalAlignment = BABYLONGUI.Control.VERTICAL_ALIGNMENT_TOP;
    this.playerHealth.paddingTop = 60;
    this.playerHealth.paddingLeft = 20;

    advancedTexture.addControl(this.playerHealth);    
    }
}



