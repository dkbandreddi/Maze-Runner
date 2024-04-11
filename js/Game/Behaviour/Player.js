import { Character } from './Character.js';
import { State } from './State';

export class Player extends Character {

	constructor(colour, id) {
		super(colour, id);
		this.lives = 3;
		this.score = 0;
		this.frictionMagnitude = 20;

		// State
		this.state = new IdleState();

		this.state.enterState(this);
	}
	loseLife() {
		this.lives -= 1;
		document.getElementById('lives').innerText = `Lives: ${this.lives}`;
		console.log(" number of lives " +  this.lives);
		if (this.lives <= 0) {
			return true; // Player lost all lives
		}
		return false; // Player still has lives left
	}
	addlife(){
		this.lives += 1;
		document.getElementById('lives').innerText = `Lives: ${this.lives}`;
	}
	addScore() {
		this.score += 1;
		document.getElementById('score').innerText = `Score: ${this.score}`;
		
	}
	isAlive() {
        return this.lives > 0;
    }
	isScoreReached(){
		return this.score >= 5;
	}

	switchState(state) {
		this.state = state;
		this.state.enterState(this);
	}

	update(deltaTime, gameMap, controller) {
		this.state.updateState(this, controller);
		super.update(deltaTime, gameMap);
	}


}
 
export class IdleState extends State {

	enterState(player) {
		player.velocity.x = 0;
		player.velocity.z = 0;
	}

	updateState(player, controller) {
		if (controller.moving()) {
			player.switchState(new MovingState());
		}
	}

}

export class MovingState extends State {

	enterState(player) {
	}

	updateState(player, controller) {

		if (!controller.moving()) {
			player.switchState(new IdleState());
		} else {
			let force = controller.direction();
			force.setLength(50);
			player.applyForce(force);
		
		}	
	}
  
}
