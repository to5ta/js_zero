import { Logging } from "./Logging";

enum GameEventType {
    GameStarted,
    GamePaused,
    GameConinued,
    PlayerHealthChanged,
    PlayerDied
}

interface GameEvent<GameEventType> {
    type: GameEventType;
    dispatcher: object;
    data: object;
}

interface GameEventSubscriber {
    onEvent<GameEventType>(gameEvent: GameEvent<GameEventType>) : boolean;
}

class GameEventHandler {
    private static subscribers = new Map<GameEventType, Array<GameEventSubscriber>>(); 

    public static addGameEventCallback(subscriber : GameEventSubscriber, type: GameEventType ) {
        if (GameEventHandler.subscribers.get(type) == undefined) {
            GameEventHandler.subscribers.set(type, new Array<GameEventSubscriber>());
        }
        if (GameEventHandler.subscribers.get(type)?.indexOf(subscriber) == -1) {
            GameEventHandler.subscribers.get(type)?.push(subscriber);
        }         
    }
    
    public static removeGameEventCallback(subscriber : GameEventSubscriber, type: GameEventType ) {
        if (GameEventHandler.subscribers.get(type) != undefined) {
            while (GameEventHandler.subscribers.get(type)!.indexOf(subscriber) > -1) {
                GameEventHandler.subscribers.get(type)!.splice(
                    GameEventHandler.subscribers.get(type)!.indexOf(subscriber, 0), 1);
            }
        }
    }

    // public static dispatchEvent(event: GameEvent<GameEventType>){
    public static dispatchEvent(type: GameEventType, dispatcher: object, data: object){
        if (GameEventHandler.subscribers.get(type) != undefined) {
            GameEventHandler.subscribers.get(type)!.forEach(subscriber => {
                subscriber.onEvent({type: type, dispatcher: dispatcher, data: data  });
            })
        
        }
    }
}


export {
    GameEventType,
    GameEvent,
    GameEventSubscriber,
    GameEventHandler
}