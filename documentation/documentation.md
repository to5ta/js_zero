# JS-Zero, a Online-RPG Prototype
Technical notes and documentation


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
        * build extensible and beautiful (yards with gate and levers)
        * fix skybox
        * fix controls (sprinting only forward, allowing to turn character without turning camera)
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

# 