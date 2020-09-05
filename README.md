# Project Zero

A third-person medieval online-game.

Powered by blender, babylon.js, npm and github.

All assets created by my own - expect the current song that was donated for that game :).

Inspired by the awesome 'Sketchbook' Project made by swift502 (https://github.com/swift502/Sketchbook).

![Promo](promo2.PNG)

## TODO

### Infrastructure 
- [X] Deploy online to Github Pages
- [ ] -CI-/CD deploy master to homepage 

### Structure
- [ ] Abstract level concept to enable multiple levels
- [ ] rework and maybe outsource keybinding from player
- [ ] Load something like a Level
- [ ] Fix Pivot in Player Model (share one player base position)

### Appearance
- [X] Add Character model
- [x] Make a camera that follows the character
- [X] Animate Character model (mapped to states like 'run')
- [X] Self-made skybox / 6 images rendered with Blender
- [x] Play Music
- [x] Play Sound-Effects
- [ ] Constumized loading screen
- [ ] Rework Character Animations
- [ ] GUI Overlay with Image (Health, ...)
- [ ] Reflection Texture for metallic stuff

### Interaction
- [x] Player Controls 
- [x] Faked Player Physics
- [x] Debuging-Fly Mode
- [ ] Game Menu
- [ ] Item Menu
- [ ] Pickable Items 
- [ ] Proper cloths & weapons for character (switchable)
- [ ] Minimum mobile controls concept
- [ ] Player Actions like fighting, interacting...


## Roadmap
- Multiplayer-Experience
- NPCs with AI
- ...
- Profit

## Installation

1. Install NPM from https://nodejs.org/de/
2. `npm install` to install all dependencies
3. `npm run dev` to host the app locally
4. open `localhost:8080` in your Browser

## Online-Demo

https://to5ta.github.io/js_zero/dist/