import { Logging } from "./Logging";

enum GameEventType {
    GameStarted,
    GamePaused,
    GameConinued,
    PlayerHealthChanged,
    PlayerDied,
    SensorActivated,
    SensorDeactivated,
}

interface GameEvent {
    type: GameEventType;
    dispatcher: object;
    data: object;
}

class GameEventHandler {
    private static callbacks = new Map<GameEventType, Array<(gameEvent: GameEvent) => void>>(); 

    public static addGameEventsListener(types: Array<GameEventType>, callback : (gameEvent: GameEvent) => void ) {
        types.forEach((type) => {
            GameEventHandler.addGameEventListener(type, callback);
        })
    };
    
    public static addGameEventListener(type: GameEventType, callback : (gameEvent: GameEvent) => void ) {
        if (GameEventHandler.callbacks.get(type) == undefined) {
            GameEventHandler.callbacks.set(type, new Array<(gameEvent: GameEvent) => void>);
        }
        if (GameEventHandler.callbacks.get(type)?.indexOf(callback) == -1) {
            GameEventHandler.callbacks.get(type)?.push(callback);
        }
    }

    public static removeGameEventListener(type: GameEventType, callback : (gameEvent: GameEvent) => {} ) {
        if (GameEventHandler.callbacks.get(type) != undefined) {
            while (GameEventHandler.callbacks.get(type)!.indexOf(callback) > -1) {
                GameEventHandler.callbacks.get(type)!.splice(
                    GameEventHandler.callbacks.get(type)!.indexOf(callback, 0), 1);
            }
        }
    }

    public static dispatchEvent(type: GameEventType, dispatcher: object, data: object){
        if (GameEventHandler.callbacks.get(type) != undefined) {
            GameEventHandler.callbacks.get(type)!.forEach(callback => {
                callback({type: type, dispatcher: dispatcher, data: data  });
            })
        }
    }
}


export {
    GameEventType,
    GameEvent,
    GameEventHandler
}