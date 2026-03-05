import { App } from './core/App';
import { Logger, LogLevel } from './core/Logger';
import './styles.css';

/**
 * Entry point for the reimplementation
 */

// Set log level based on environment
if (process.env.NODE_ENV === 'development') {
    Logger.setLogLevel(LogLevel.DEBUG);
} else {
    Logger.setLogLevel(LogLevel.INFO);
}

Logger.info('=== JS_Zero Reimplementation ===');
Logger.info('Starting application...');

// Create and start the application
const app = new App();

// Subscribe to focus events for debugging
const eventBus = app.getEventBus();

eventBus.on('app:focus', (data) => {
    if (data.gained) {
        console.log('🎯 [EVENT] App gained focus');
    } else {
        console.log('😴 [EVENT] App lost focus');
    }
});

eventBus.on('app:resize', (data) => {
    console.log(`📐 [EVENT] Window resized to ${data.width}x${data.height}`);
});

eventBus.on('loading:started', (data) => {
    console.log(`⏳ [EVENT] Loading started (${data.total} items)`);
});

eventBus.on('loading:progress', (data) => {
    console.log(`📦 [EVENT] Loading progress: ${data.loaded}/${data.total}`);
});

eventBus.on('loading:complete', () => {
    console.log('✅ [EVENT] Loading complete');
});

// Start the app
app.start().then(() => {
    Logger.info('Application ready!');
    
    // Make app available globally for debugging
    (window as any).app = app;
    console.log('💡 Tip: Access app via window.app in console');
});

// Handle cleanup on page unload
window.addEventListener('beforeunload', () => {
    app.dispose();
});
