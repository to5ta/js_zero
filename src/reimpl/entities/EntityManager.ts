import { Entity } from './Entity';
import { Logger } from '../core/Logger';

/**
 * Manages a collection of entities with lifecycle management
 * Handles adding, removing, updating, and disposing entities
 */
export class EntityManager {
    private entities: Map<string, Entity> = new Map();
    private entitiesToAdd: Entity[] = [];
    private entitiesToRemove: string[] = [];
    
    constructor() {
        Logger.info('Entity manager initialized');
    }
    
    /**
     * Add an entity to be managed
     * Entity will be added at the start of next update cycle
     */
    public add(entity: Entity): void {
        this.entitiesToAdd.push(entity);
        Logger.debug(`Queued entity for addition: ${entity.name}`);
    }
    
    /**
     * Remove an entity by name
     * Entity will be removed at the end of next update cycle
     */
    public remove(name: string): void {
        if (this.entities.has(name)) {
            this.entitiesToRemove.push(name);
            Logger.debug(`Queued entity for removal: ${name}`);
        } else {
            Logger.warn(`Cannot remove entity: ${name} not found`);
        }
    }
    
    /**
     * Get an entity by name
     */
    public get(name: string): Entity | undefined {
        return this.entities.get(name);
    }
    
    /**
     * Check if an entity exists
     */
    public has(name: string): boolean {
        return this.entities.has(name);
    }
    
    /**
     * Get all entities
     */
    public getAll(): Entity[] {
        return Array.from(this.entities.values());
    }
    
    /**
     * Get all entities of a specific type
     */
    public getAllOfType<T extends Entity>(type: new (...args: any[]) => T): T[] {
        return this.getAll().filter(entity => entity instanceof type) as T[];
    }
    
    /**
     * Get count of active entities
     */
    public get count(): number {
        return this.entities.size;
    }
    
    /**
     * Update all active entities
     * Processes additions and removals at appropriate times
     */
    public update(deltaTime: number): void {
        // Process additions first
        this.processAdditions();
        
        // Update all active entities
        for (const entity of this.entities.values()) {
            if (entity.isActive) {
                entity.update(deltaTime);
            }
        }
        
        // Process removals last
        this.processRemovals();
    }
    
    /**
     * Process queued entity additions
     */
    private processAdditions(): void {
        if (this.entitiesToAdd.length === 0) return;
        
        for (const entity of this.entitiesToAdd) {
            if (this.entities.has(entity.name)) {
                Logger.warn(`Entity ${entity.name} already exists, skipping addition`);
                continue;
            }
            
            this.entities.set(entity.name, entity);
            Logger.info(`✨ Entity added: ${entity.name}`);
        }
        
        this.entitiesToAdd = [];
    }
    
    /**
     * Process queued entity removals
     */
    private processRemovals(): void {
        if (this.entitiesToRemove.length === 0) return;
        
        for (const name of this.entitiesToRemove) {
            const entity = this.entities.get(name);
            if (entity) {
                entity.dispose();
                this.entities.delete(name);
                Logger.info(`🗑️ Entity removed: ${name}`);
            }
        }
        
        this.entitiesToRemove = [];
    }
    
    /**
     * Remove and dispose all entities
     */
    public clear(): void {
        Logger.info(`Clearing ${this.entities.size} entities...`);
        
        for (const entity of this.entities.values()) {
            entity.dispose();
        }
        
        this.entities.clear();
        this.entitiesToAdd = [];
        this.entitiesToRemove = [];
        
        Logger.info('All entities cleared');
    }
    
    /**
     * Dispose entity manager and all entities
     */
    public dispose(): void {
        Logger.info('Disposing entity manager...');
        this.clear();
    }
}
