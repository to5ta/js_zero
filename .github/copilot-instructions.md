# JS_Zero Development Guide for AI Agents

## Project Overview
Third-person medieval game prototype built with **BabylonJS 6.x**, TypeScript, and Havok physics. Contains two codebases:
- **Legacy (`src/code/`)**: Original implementation with custom physics
- **Reimplementation (`src/reimpl/`)**: Clean architecture rebuild with ECS patterns

### Reimplementation Goal
The `src/reimpl/` codebase aims to **technically replicate the features** from the legacy implementation with cleaner architecture. Cannot directly copy legacy code, but should achieve similar effects:
- Player movement feel (WASD controls, sprint, jump, slope handling)
- Animation blending and transitions (idle → walk → run states)
- Camera behavior (smooth following, mouse drag rotation)
- Physics interactions (collision detection, gravity)
- Context handling (focus/blur events, mobile vs desktop)

**Focus on matching the gameplay experience**, not copying implementation details.

## Architecture Patterns

### Reimplementation (src/reimpl/) - Preferred for new work
Uses clean separation with **Entity-Component-System** inspired architecture:

- **Core Systems**: `App.ts` orchestrates lifecycle, `EventBus.ts` provides type-safe pub/sub
- **Entity Pattern**: All game objects extend `Entity` base class with `init()`, `update(deltaTime)`, `dispose()` lifecycle
- **EntityManager**: Handles safe addition/removal during game loops - entities queued for add/remove are processed at frame boundaries
- **System Modules**: `InputSystem`, `CameraController`, `PhysicsManager` operate on entities
- **Type-safe Events**: `EventBus` uses `EventMap` type for compile-time event safety

Example entity lifecycle:
```typescript
const player = new SimplePlayer(scene, inputSystem);
player.init(); // Setup meshes/materials
entityManager.add(player); // Queued for next frame
// In game loop: entityManager.update(deltaTime) calls player.update(deltaTime)
```

### Legacy (src/code/) - Maintenance only
- Tightly coupled classes: `Game`, `Player`, `CharacterController`, `GameWorld`
- Custom collision system using `mesh.moveWithCollisions()`
- Event system via `GameEventHandler` singleton
- **Do not mix** patterns between old and new codebases

## Build & Development Workflows

### Essential Commands
```bash
npm run dev:reimpl        # Dev server on port 8080 (reimpl, changed from 8081)
npm run dev               # Legacy app on port 8080
npm run build:reimpl      # Production build → dist-reimpl/
npm run build             # Legacy build → dist/
python scripts/assets.py --download  # Download game assets (required for first run)
```

### Dual Webpack Configs
- `webpack.config.js`: Legacy entry `src/code/index.ts` → `dist/`
- `webpack.reimpl.config.js`: Reimpl entry `src/reimpl/main.ts` → `dist-reimpl/`
- Both handle `.glb`, `.gltf`, `.mp3` via `file-loader`

### Asset Management
- Models/textures in `src/assets/` imported directly: `import model from '../assets/models/wache02.glb'`
- Python script downloads large assets from external source
- Webpack copies `.php` files for session management

## BabylonJS & Physics Specifics

### Physics Initialization (Reimpl)
**Critical**: Havok physics must be initialized **before** adding physics bodies:
```typescript
await physicsManager.init(); // Async WASM load
// THEN create bodies:
physicsManager.createBody(mesh, 'dynamic', { mass: 1.0, friction: 0.5 });
```

### Character Movement
- **Legacy**: Uses `mesh.moveWithCollisions()` with custom slope detection
- **Reimpl**: Direct velocity manipulation with raycasting for ground detection
- **No Havok character controllers** - custom implementation for slope handling

### Camera Pattern
Both use `ArcRotateCamera` locked to player with manual input handling:
- Reimpl: `CameraController` system with smooth lerp following
- Legacy: Direct camera manipulation in `Player` class

## Project-Specific Conventions

### Logging & Debug
- Reimpl uses structured `Logger` class with levels (DEBUG, INFO, WARN, ERROR)
- Console emojis for events: 🎯 focus, 📦 loading, ✅ complete
- Debug UI toggled via `window.toggleDebugUI()` in browser console
- 3D debug lines controlled via `SimplePlayer.setDebugVisualsEnabled(true)`

### Mobile Detection
`Environment.isMobile` checks user agent - used for touch controls and layout:
```typescript
Environment.init(); // Must call before accessing Environment.canvas
```

### TypeScript Configuration
- `strict: true` with `strictPropertyInitialization: false` (Babylon meshes init in lifecycle methods)
- Target ES6, source maps enabled for debugging
- No implicit any - always type function parameters

### Animation System
Models use frame-range based animations:
```typescript
animations: {
  'idle': { loop: true, speed: 1.0, from: 0, to: 60 },
  'walk': { loop: true, speed: 1.0, from: 61, to: 120 }
}
```

## Key Files & Boundaries

### Critical Reimpl Files
- `src/reimpl/core/App.ts`: Application lifecycle orchestrator (476 lines)
- `src/reimpl/core/EventBus.ts`: Type-safe event system - **extend EventMap type** when adding events
- `src/reimpl/entities/EntityManager.ts`: Safe entity lifecycle with queued operations
- `src/reimpl/systems/PhysicsManager.ts`: Havok wrapper - all physics ops go through this

### Integration Points
- `Environment.canvas`: Shared canvas created in `Environment.init()`
- `Stats.js`: FPS counter attached to DOM in `App` constructor
- Loading screen: Custom implementation via `engine.loadingScreen` interface

### No-Go Zones
- Don't modify webpack configs without understanding dual-build setup
- Don't mix legacy `GameEventHandler` with reimpl `EventBus`
- Avoid direct BabylonJS physics calls in reimpl - use `PhysicsManager`

## Common Pitfalls

1. **Physics before init**: Always `await physicsManager.init()` before creating bodies
2. **Entity lifecycle**: Never directly manipulate EntityManager's internal map - use `add()`/`remove()` for safe frame-boundary processing
3. **Event type safety**: When adding events, update `EventMap` in `EventBus.ts` first
4. **Asset paths**: Use relative imports from source files, not absolute paths
5. **Dispose order**: Scene → Physics → Engine (reimpl `App.dispose()` shows correct order)
