/**
 * Type-safe Event Bus for game events
 */

export type EventMap = {
    'app:focus': { gained: boolean };
    'app:resize': { width: number; height: number };
    'loading:started': { total: number };
    'loading:progress': { loaded: number; total: number };
    'loading:complete': {};
    'player:health-changed': { health: number; maxHealth: number };
    'player:died': {};
};

type EventCallback<T> = (data: T) => void;
type Unsubscribe = () => void;

export class EventBus {
    private listeners = new Map<keyof EventMap, Set<EventCallback<any>>>();
    
    /**
     * Subscribe to an event
     * @returns Unsubscribe function
     */
    public on<K extends keyof EventMap>(
        event: K, 
        callback: EventCallback<EventMap[K]>
    ): Unsubscribe {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(callback);
        
        // Return unsubscribe function
        return () => this.off(event, callback);
    }
    
    /**
     * Unsubscribe from an event
     */
    public off<K extends keyof EventMap>(
        event: K, 
        callback: EventCallback<EventMap[K]>
    ): void {
        this.listeners.get(event)?.delete(callback);
    }
    
    /**
     * Emit an event to all listeners
     */
    public emit<K extends keyof EventMap>(
        event: K, 
        data: EventMap[K]
    ): void {
        this.listeners.get(event)?.forEach(callback => callback(data));
    }
    
    /**
     * Remove all listeners
     */
    public clear(): void {
        this.listeners.clear();
    }
    
    /**
     * Remove all listeners for a specific event
     */
    public clearEvent<K extends keyof EventMap>(event: K): void {
        this.listeners.delete(event);
    }
}
