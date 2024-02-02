
interface GameEvent {
    type: string;
    dispatcher?: string;
    data?: Object;
}

abstract class GameEventDispatcher {
    private listeners = new Array<GameEventListener>(); 

    private static takenNames = new Array<string>(); 
    readonly name: string;

    // derived classes should call this with a proper, unique name 
    constructor(name: string) {
        if (GameEventDispatcher.takenNames.indexOf(name) > -1) {
            this.name = name.concat("_", Math.random().toString(36).substring(7));
            throw new Error(`Name "${name}" is already used, using ${this.name} instead!`);
        } else {
            this.name = name;
        }
        GameEventDispatcher.takenNames.push(this.name);
    }

    public addGameEventListener(listener: GameEventListener) {
        if (this.listeners.indexOf(listener) == -1) {
            this.listeners.push(listener);
        }
    }

    public removeGameEventListener(listener: GameEventListener) {
        while (this.listeners.indexOf(listener) > -1) {
            this.listeners.splice(this.listeners.indexOf(listener, 0), 1);
        }
    }

    public dispatchEvent(event: GameEvent){
        event.dispatcher = this.name;
        this.listeners.forEach(listener => {
            // Logging.info("\nDispatcher: ",event.dispatcher,", Type: ",event.type);
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