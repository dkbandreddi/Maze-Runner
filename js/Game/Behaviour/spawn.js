import { Character } from "./Character.js";

export class Spawn extends Character {
    constructor(mColor, type, id) {
        super(mColor, id);
        
        
        // add more initialization
        this.frictionMagnitude = 20;
        this.type = type;
    
    }

    update(deltaTime, gameMap) {
        super.update(deltaTime, gameMap);
    }

}