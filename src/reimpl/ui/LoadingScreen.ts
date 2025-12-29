import { ILoadingScreen } from '@babylonjs/core/Loading';
import { EventBus } from '../core/EventBus';
import { Logger } from '../core/Logger';

/**
 * Custom loading screen implementation
 */
export class LoadingScreen implements ILoadingScreen {
    public loadingUIBackgroundColor: string = '#0a0a0f';
    public loadingUIText: string = 'Loading...';
    
    private container?: HTMLDivElement;
    private progressBar?: HTMLDivElement;
    private progressFill?: HTMLDivElement;
    private loadingText?: HTMLDivElement;
    private eventBus: EventBus;
    
    constructor(eventBus: EventBus) {
        this.eventBus = eventBus;
        
        // Listen to loading events
        this.eventBus.on('loading:progress', (data) => {
            this.updateProgress(data.loaded, data.total);
        });
    }
    
    /**
     * Called when loading screen should be displayed
     */
    public displayLoadingUI(): void {
        Logger.info('Displaying loading screen');
        
        // Create container
        this.container = document.createElement('div');
        this.container.style.position = 'fixed';
        this.container.style.top = '0';
        this.container.style.left = '0';
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.container.style.backgroundColor = this.loadingUIBackgroundColor;
        this.container.style.display = 'flex';
        this.container.style.flexDirection = 'column';
        this.container.style.justifyContent = 'center';
        this.container.style.alignItems = 'center';
        this.container.style.zIndex = '9999';
        this.container.style.fontFamily = 'Arial, sans-serif';
        
        // Create loading text
        this.loadingText = document.createElement('div');
        this.loadingText.textContent = this.loadingUIText;
        this.loadingText.style.color = 'white';
        this.loadingText.style.fontSize = '24px';
        this.loadingText.style.marginBottom = '30px';
        
        // Create progress bar container
        this.progressBar = document.createElement('div');
        this.progressBar.style.width = '300px';
        this.progressBar.style.height = '20px';
        this.progressBar.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        this.progressBar.style.borderRadius = '10px';
        this.progressBar.style.overflow = 'hidden';
        this.progressBar.style.border = '2px solid rgba(255, 255, 255, 0.3)';
        
        // Create progress fill
        this.progressFill = document.createElement('div');
        this.progressFill.style.width = '0%';
        this.progressFill.style.height = '100%';
        this.progressFill.style.backgroundColor = '#4CAF50';
        this.progressFill.style.transition = 'width 0.3s ease';
        
        // Assemble
        this.progressBar.appendChild(this.progressFill);
        this.container.appendChild(this.loadingText);
        this.container.appendChild(this.progressBar);
        
        document.body.appendChild(this.container);
    }
    
    /**
     * Called when loading screen should be hidden
     */
    public hideLoadingUI(): void {
        Logger.info('Hiding loading screen');
        
        if (this.container) {
            // Fade out animation
            this.container.style.transition = 'opacity 0.5s ease';
            this.container.style.opacity = '0';
            
            setTimeout(() => {
                if (this.container && this.container.parentNode) {
                    this.container.parentNode.removeChild(this.container);
                }
                this.container = undefined;
                this.progressBar = undefined;
                this.progressFill = undefined;
                this.loadingText = undefined;
            }, 500);
        }
    }
    
    /**
     * Update progress bar
     */
    private updateProgress(loaded: number, total: number): void {
        if (this.progressFill) {
            const percentage = Math.min(100, (loaded / total) * 100);
            this.progressFill.style.width = `${percentage}%`;
            
            if (this.loadingText) {
                this.loadingText.textContent = `Loading... ${Math.round(percentage)}%`;
            }
            
            Logger.debug(`Loading progress: ${Math.round(percentage)}%`);
        }
    }
}
