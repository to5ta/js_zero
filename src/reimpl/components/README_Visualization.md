# Player Visualization Integration

## Overview

The `PlayerVisualization` component provides character model, animation, and sound management for the player entity. It's completely decoupled from physics and movement logic, allowing visual representation to be added optionally without affecting gameplay.

## Architecture

- **Location**: `src/reimpl/components/PlayerVisualization.ts`
- **Integration**: Attached to `SimplePlayer` entity as an optional component
- **Separation**: Visual representation is separate from physics capsule
- **Sync**: Position and rotation are synced each frame from physics to visuals

## Key Features

✅ **Async Model Loading**: Uses promises for clean asynchronous loading  
✅ **Animation Management**: Load and play named animations with configuration  
✅ **Sound Support**: Optional audio playback synchronized with animations  
✅ **Position Syncing**: Automatically follows physics capsule position  
✅ **Clean Disposal**: Proper cleanup of all resources  
✅ **No Physics Impact**: Completely isolated from movement/collision logic

## Usage Example

```typescript
// In your game initialization code (e.g., App.ts)

// 1. Create player entity (physics capsule)
const player = new SimplePlayer(scene, inputSystem);
player.init(); // Creates physics capsule

// 2. Load visualization (optional)
await player.loadVisualization(
    'models/character.glb',
    {
        'idle': {
            loop: true,
            speed: 1.0,
            from: 0,
            to: 60,
        },
        'walk': {
            loop: true,
            speed: 1.0,
            from: 61,
            to: 120,
        },
        'run': {
            loop: true,
            speed: 1.5,
            from: 121,
            to: 180,
        },
        'jump': {
            loop: false,
            speed: 1.0,
            from: 181,
            to: 200,
            soundfile: 'sounds/jump.wav'
        }
    }
);

// 3. Play animations during gameplay
const visualization = player.getVisualization();
if (visualization && visualization.isLoaded()) {
    // Play based on player state
    if (player.getIsGrounded()) {
        const velocity = player.getCurrentVelocity();
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);
        
        if (speed > 0.1) {
            visualization.play(speed > 5 ? 'run' : 'walk');
        } else {
            visualization.play('idle');
        }
    } else {
        visualization.play('jump');
    }
}
```

## API Reference

### Loading

```typescript
await player.loadVisualization(modelPath: string, animationConfigs: object)
```
Loads a 3D model with animations and sounds. Returns a promise that resolves when loading is complete.

### Animation Control

```typescript
visualization.play(animationName: string): void
visualization.stop(): void
visualization.isPlaying(animationName: string): boolean
visualization.getCurrentAnimation(): string | undefined
visualization.getAnimationNames(): string[]
```

### Position/Rotation (Auto-synced)

These are called automatically by SimplePlayer.update():
```typescript
visualization.setPosition(position: Vector3): void
visualization.setRotation(rotation: Vector3): void
visualization.setOrientation(azimuth: number): void
```

### Sound Control

```typescript
visualization.playSound(soundName: string): void
```

### State

```typescript
visualization.isLoaded(): boolean
visualization.getMesh(): Mesh | undefined
```

### Cleanup

```typescript
visualization.dispose(): void // Called automatically by player.dispose()
```

## Animation Configuration

Each animation can be configured with:

```typescript
{
    loop: boolean,        // Should animation loop?
    speed: number,        // Playback speed multiplier
    from: number,         // Start frame
    to: number,           // End frame
    soundfile?: string    // Optional sound file path
}
```

## Benefits of This Approach

1. **Modular**: Visualization can be added or removed without touching physics
2. **Optional**: Player works fine without visualization (useful for testing)
3. **Clean**: Clear separation of concerns between physics and rendering
4. **Flexible**: Easy to swap models or animations without changing gameplay code
5. **Testable**: Physics can be tested independently of visual assets
6. **Performance**: Can disable visualization for headless/testing scenarios

## Implementation Details

### How It Works

1. **Physics Capsule**: SimplePlayer creates a simple capsule for collision/movement
2. **Visual Model**: PlayerVisualization loads and manages the character model
3. **Sync Loop**: Each frame, player's position/rotation is copied to visualization
4. **No Interference**: Visualization mesh doesn't participate in physics

### Why This Design?

The original `CharacterVisualization` was tightly coupled to physics. The new design:

- Separates visual from physical representation
- Uses modern async/await instead of callback-based loading
- Follows the entity-component architecture
- Makes testing easier (can test physics without assets)
- Allows runtime model swapping
- Reduces complexity in the player entity

## Migration from Original Implementation

### Original (src/code/CharacterVisualization.ts)
```typescript
// Tightly coupled with AssetsManager
constructor(modelfile, assetManager, scene, animations)
// Callback-based loading
assetManager.load()
// Direct mesh manipulation
setPosition(), setRotation(), setOrientation()
```

### New (src/reimpl/components/PlayerVisualization.ts)
```typescript
// Self-contained, no external manager needed
constructor(scene)
// Promise-based loading
await load(modelPath, animations)
// Component attached to entity
player.loadVisualization()
// Automatic position syncing
```

## Future Enhancements

Potential additions without breaking current design:

- [ ] IK (Inverse Kinematics) for foot placement
- [ ] Blend trees for smooth animation transitions
- [ ] LOD (Level of Detail) management
- [ ] Ragdoll physics on death
- [ ] Facial expressions/lip sync
- [ ] Dynamic clothing/equipment
- [ ] Shadow blending
- [ ] Motion capture data support

All of these can be added to `PlayerVisualization` without touching `SimplePlayer`!
