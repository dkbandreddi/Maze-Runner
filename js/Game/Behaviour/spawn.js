import { Character } from "./Character.js";

export class Spawn extends Character {
    constructor(mColor, type) {
        super(mColor);
        
        
        // add more initialization
        this.frictionMagnitude = 20;
        this.type = type;
    
    }

    update(deltaTime, gameMap) {
        super.update(deltaTime, gameMap);
    }

}