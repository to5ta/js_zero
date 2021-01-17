# JS-Zero, a Online-RPG Prototype
Technical notes and documentation


# Game Design

## Overall-Target

Show some interesting game mechanics and capabilities: 
* Basic character movement on
    * Stairs
    * Slopes
    * (Ladders?)
* Falling
* Moving Elements such as platforms, pitfalls, lifts
* Melee
* Ranged 



# Testing

* **2020-12-25:** 
    * Pro:
        * Nice Model and walk cycle
        * the size of the level is quite suitable together with the walking speed (approx. 60x80m currently)
        * excellent bg music
        * mostly nice controls
    * Contra:
        * The Level is ugly af
        * the skybox is ugly af
        * no shoes, helmet, sleeves
        * control & animation issues: strifing, turning, sprinting
        * "Nothing to do" besides walking arround and playing with controls
        * sound effects are lame
        * No Action, no fighting, no enemies, no items to collect
    * TODO:
        * build extensible and beautiful (yards with gate and levers) level
        * fix skybox
        * [x] fix controls (sprinting only forward, allowing to turn character without turning camera)
        * animations: turning, strafing (left, right)
        * model plate boots
        * evalute if controls cant get rid of mouse input (just simple tombraider controls?)


# Game Composition

(Reusable-) Classes for
* Levels
    * Static Elements
    * Dynamic Elements
        * Animated
        * Action-driven
* Items
    * Cloth
    * Weapons
    * Ammo
    * Usables
* Characters
    * Player
    * AI / NPC




# TODO

## Infrastructure 
- [X] Deploy online to Github Pages
- [ ] -CI-/CD deploy master to homepage 

## Structure
- [ ] Abstract level concept to enable multiple levels
- [ ] rework and maybe outsource keybinding from player
- [ ] Load something like a Level
- [ ] Fix Pivot in Player Model (share one player base position)

## Appearance
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

## Interaction
- [x] Player Controls 
- [x] Faked Player Physics
- [x] Debuging-Fly Mode
- [ ] Game Menu
- [ ] Item Menu
- [ ] Pickable Items 
- [ ] Proper cloths & weapons for character (switchable)
- [ ] Minimum mobile controls concept
- [ ] Player Actions like fighting, interacting...

