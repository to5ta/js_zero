
interface GameEvent {
    type: string;
    data?: Object;
}

class GameEventEmitter {
    private typeToListeners = new Map<string, Array<GameEventListener>>(); 


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

    public emitEvent(event: GameEvent){
        const listeners = this.typeToListeners.get(event.type);
        listeners?.forEach(listener => {
            listener.onEvent(event);
        });
    }
}

interface GameEventListener {
    onEvent(event: GameEvent): void;
}

export {
    GameEvent,
    GameEventEmitter,
    GameEventListener
}