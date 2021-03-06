
interface GameEvent {
    type: string;
    dispatcher?: string;
    data?: Object;
}

class GameEventDispatcher {
    private typeToListeners = new Map<string, Array<GameEventListener>>(); 

    private name: string;

    constructor(name: string) {
        this.name = name;
    }

    public addGameEventListener(listener: GameEventListener, type: string) {
        if (this.typeToListeners.has(type)) {
            this.typeToListeners.get(type)?.push(listener);
        } else {
            this.typeToListeners.set(type, new Array<GameEventListener>(listener));
        }
    }

    public removeGameEventListener(listener: GameEventListener, type: string) {
        if(this.typeToListeners.has(type)) {
            const listeners = this.typeToListeners.get(type) as  Array<GameEventListener>;

            while (listeners.indexOf(listener, 0) > -1) {
                listeners.splice(listeners.indexOf(listener, 0), 1);
            }
        }
    }

    public dispatchEvent(event: GameEvent){
        event.dispatcher = this.name;
        const listeners = this.typeToListeners.get(event.type);
        listeners?.forEach(listener => {
            // console.log("\nDispatcher: ",event.dispatcher,", Type: ",event.type);
            listener.onEvent(event);
        });
    }
}

interface GameEventListener {
    onEvent(event: GameEvent): void;
}

export {
    GameEvent,
    GameEventDispatcher,
    GameEventListener
}