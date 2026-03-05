# JS_Zero - Reimplementation

Clean architecture rebuild from scratch, implementing best practices and modern patterns.

## Structure

```
src/reimpl/
├── core/                    # Core engine components
│   ├── App.ts              # Main application class
│   ├── EventBus.ts         # Type-safe event system
│   ├── Environment.ts      # Device/platform detection
│   └── Logger.ts           # Logging utility
├── systems/                 # Game systems
│   ├── InputState.ts       # Input state tracking
│   ├── InputSystem.ts      # Input management
│   └── CameraController.ts # Camera follow system
├── entities/                # Game entities
│   ├── Entity.ts           # Base entity class
│   ├── EntityManager.ts    # Entity lifecycle manager
│   ├── SimplePlayer.ts     # Basic player with movement
│   └── TestCube.ts         # Test cube entity
├── ui/                      # UI components
│   ├── LoadingScreen.ts    # Custom loading screen
│   └── InputDebugUI.ts     # Input visualization
└── main.ts                  # Entry point
```

## Running

```bash
# Development server (port 8081)
npm run dev:reimpl

# Production build
npm run build:reimpl
```

## Features Implemented

✅ BabylonJS engine initialization  
✅ Mobile/Desktop detection  
✅ Focus/Blur event handling  
✅ Custom async loading screen  
✅ Type-safe event bus  
✅ Structured logging with colors  
✅ Proper cleanup/disposal  
✅ Input system (keyboard/mouse/touch)  
✅ Input debug visualization  
✅ Entity base class for game objects  
✅ Entity lifecycle (init/update/dispose)  
✅ EntityManager for centralized entity handling  
✅ Simple player with WASD movement  
✅ Basic gravity and jumping  
✅ Sprint functionality  
✅ Third-person camera system  
✅ Smooth camera follow with lerp  
✅ Mouse camera control (drag to rotate)  

## Console Events

All major events are logged to console with emojis:
- 🎯 Focus gained
- 😴 Focus lost
- 📐 Window resized
- ⏳ Loading started
- 📦 Loading progress
- ✅ Loading complete

## Testing Focus Events

1. Open http://localhost:8081
2. Open browser DevTools (F12)
3. Click between browser window and other apps
4. Watch console for focus/blur events
5. Resize window to see resize events

## Testing Player Controls

1. **Movement**: WASD or Arrow keys to move
2. **Sprint**: Hold Shift while moving
3. **Jump**: Press Space (works only when grounded)
4. **Camera**: Click and drag to rotate camera around player
5. **Zoom**: Mouse wheel to zoom in/out
6. **Visual Feedback**: Player capsule rotates to face movement direction

## Architecture

Uses clean separation of concerns:
- **App**: Lifecycle management
- **EventBus**: Decoupled communication
- **Environment**: Platform abstraction
- **Logger**: Consistent logging
- **InputSystem**: Input state management
- **CameraController**: Smooth camera follow with configurable behavior
- **Entity**: Base class for all game objects
- **EntityManager**: Centralized entity lifecycle and updates
- **LoadingScreen**: User feedback

Each entity manages its own lifecycle (init, update, dispose). EntityManager handles collections, batch updates, and safe addition/removal during game loop. Camera smoothly follows any entity target.

Next steps: Ground/terrain entity, physics integration, character models, lighting system...
