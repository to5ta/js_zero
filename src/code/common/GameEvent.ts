import { Logging } from "./Logging";

enum GameEventType {
    GameStarted,
    GamePaused,
    GameConinued,
}

interface GameEvent<GameEventType> {
    type: GameEventType;
    dispatcher: string;
    data: GameEventSubscriber;
}

interface GameEventSubscriber {
    onEvent<GameEventType>(gameEvent: GameEvent<GameEventType>) : boolean;
}

class GameEventHandler {
    private static subscribers = new Map<GameEventType, Array<GameEventSubscriber>>(); 

    public addGameEventCallback(subscriber : GameEventSubscriber, type: GameEventType ) {
        if (GameEventHandler.subscribers.get(type) == undefined) {
            GameEventHandler.subscribers.set(type, new Array<GameEventSubscriber>());
        }
        if (GameEventHandler.subscribers.get(type)?.indexOf(subscriber) == -1) {
            GameEventHandler.subscribers.get(type)?.push(subscriber);
        }         
    }
    
    public removeGameEventCallback(subscriber : GameEventSubscriber, type: GameEventType ) {
        if (GameEventHandler.subscribers.get(type) != undefined) {
            while (GameEventHandler.subscribers.get(type)!.indexOf(subscriber) > -1) {
                GameEventHandler.subscribers.get(type)!.splice(
                    GameEventHandler.subscribers.get(type)!.indexOf(subscriber, 0), 1);
            }
        }
    }

    public dispatchEvent(event: GameEvent<GameEventType>){
        var eventType = event.type;
        if (GameEventHandler.subscribers.get(eventType) != undefined) {
            GameEventHandler.subscribers.get(eventType)!.forEach(subscriber => {
                subscriber.onEvent(event);
            })
        
        }
    }
}


export {
    GameEventType,
    GameEvent,
    GameEventSubscriber
}