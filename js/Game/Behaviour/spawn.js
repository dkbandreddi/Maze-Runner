import { Character } from "./Character.js";

export class Spawn extends Character{
    constructor(mColor, type, model) {
        super(mColor);
        if (model){
            super.setModel(model);
        }
        
        // add more initialization

        this.type = type;
    
    }

    update(deltaTime, gameMap) {
        super.update(deltaTime, gameMap);
    }

}