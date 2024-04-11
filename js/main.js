import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GameMap } from './Game/World/GameMap.js';
import { Character } from './Game/Behaviour/Character.js';
import {  NPC, WanderState } from './Game/Behaviour/NPC.js';
import { Player } from './Game/Behaviour/Player.js';
import { Controller} from './Game/Behaviour/Controller.js';
import { Resources } from './Util/Resources.js';
import { Spawn } from './Game/Behaviour/Spawn.js';

// a master array to store references to all entities on map
var entities = []
// A map to store reference to entities by their type
var entitiesMap = {
	"coins" : [],
	"powerups" : [],
	"player" : [],
	"enemies" : []
}

var id = 0;

async function getData(url) {
	const response = await fetch(url);
	
	return response.json();
  }
  
const data = await getData("js/assets.json");

var totaltime = 0

// Create Scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();

const orbitControls = new OrbitControls(camera, renderer.domElement);

// Create clock
const clock = new THREE.Clock();

// Controller for player
const controller = new Controller(document);

// GameMap
let gameMap;

// Player
let player;
let npc1;
let npc2;
let npc3;


let gameOver;
let timeLeft = 120;
let powerUpActive =  false;





var resource = new Resources(data);

await resource.loadAll();

//console.log("here", resource.get("pacman"));

// Setup our scene
function setup() {
	id = 0;
	gameOver = false;

	document.getElementById('timer').innerText = `Timer: ${timeLeft}`;
    document.getElementById('lives').innerText = `Lives: 3`; 
	document.getElementById('score').innerText = `Score: 0/5`; 
    setInterval(() => {
        if (!gameOver && timeLeft > 0) {
            timeLeft--;
            document.getElementById('timer').innerText = `Timer: ${timeLeft}`;
        } else if (timeLeft === 0) {
            gameOver = true;
            alert("Time's up! Player Lost! Refresh page to start new game");
        }
    }, 1000);

	scene.background = new THREE.Color(0xffffff);
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(renderer.domElement);

	camera.position.y = 65;
	camera.lookAt(0,0,0);

	//Create Light
	let directionalLight = new THREE.DirectionalLight(0xffffff, 2);
	directionalLight.position.set(0, 5, 5);
	scene.add(directionalLight);

	// initialize our gameMap
	gameMap = new GameMap();
	gameMap.init(scene);
	scene.add(gameMap.gameObject);
	
	
	// Create Player
	
	player = new Player(new THREE.Color(0xff0000), id);
	id += 1;
	player.size = 3.5;
	player.setModel(resource.get("pacman2"));
	console.log(player.gameObject);
	player.gameObject.scale.set(1,1,1);
	entities.push(player)
	entitiesMap["player"].push(player);


	npc1 = new NPC(new THREE.Color(0xff0000),gameMap, player, id);
	id += 1;
	npc1.setModel(resource.get("ghost pacman"));
	npc1.location = gameMap.localize(gameMap.graph.getRandomEmptyTile());
	entities.push(npc1)
	entitiesMap["enemies"].push(npc1);
	
	npc2 = new NPC(new THREE.Color(0xff0000),gameMap, player, id);
	id += 1;
	npc2.setModel(resource.get("ghost yellow"));
	npc2.location = gameMap.localize(gameMap.graph.getRandomEmptyTile());
	entities.push(npc2)
	entitiesMap["enemies"].push(npc2);

	/*
	let coin = new Spawn(new THREE.Color(0x00ff00), "coin");
	coin.setModel(resource.get("roman coin"));
	coin.location = gameMap.localize(gameMap.graph.getRandomEmptyTile());
	entities.push(coin);
	entitiesMap["coins"].push(coin);
	*/
	
	
	/*
	npc3 = new Spawn(new THREE.Color(0xff0000),"coin");
	npc3.setModel(resource.get("coin"));
	npc3.size = 0.01;
	npc3.location = gameMap.localize(gameMap.graph.getRandomEmptyTile());

	entities.push(npc3)
	entitiesMap["enemies"].push(npc3);
	*/

	// Add all entities to the scene
	for(let i=0; i < entities.length; i++) {
		
		scene.add(entities[i].gameObject);
	}



	// Get a random starting place for the enemy
	let startPlayer = gameMap.graph.getRandomEmptyTile();
	// this is where we start the player
	player.location = gameMap.localize(startPlayer);
	//First call to animate
	animate();
	
}

function checkSpawns(deltaTime) {
	var secs = clock.getElapsedTime();
	totaltime = totaltime + deltaTime;
	if (totaltime > 3) {
		var flag = true
		totaltime = 0;
	}
	//var flag = Math.trunc(secs) % 5 == 0;

	
	
	
	if (flag && entitiesMap["coins"].length <= 3 ) {
		
		
		let coin = new Spawn(new THREE.Color(0x00ff00), "coin", id);
		id += 1;
		coin.size = 0.75;
		coin.setModel(resource.get("coin2"));

		coin.location = gameMap.localize(gameMap.graph.getRandomEmptyTile());
		
		
		entities.push(coin);
		entitiesMap["coins"].push(coin);
		
		
		coin.gameObject.name = "coin".concat(entitiesMap["coins"].length.toString());
		scene.add(coin.gameObject);
		flag = false;
	}

	
	if (entitiesMap["powerups"].length == 0 && Math.trunc(secs) % 25 == 0){
		//spawn power up
		let m = resource.get("powerup");
		let power = new Spawn(new THREE.Color(0x00ff00), "powerup", id);
		id += 1;
		power.setModel(resource.get("powerup"));
		
		power.location = gameMap.localize(gameMap.graph.getRandomEmptyTile());
		
		entities.push(power);
		entitiesMap["powerups"].push(power);

		scene.add(power.gameObject);
	}	
}

function checkHealth(deltaTime) {
	if (player.health1 != 3) {
		
	}
}

// function checkCollisions() {

// 	for ( let i = entitiesMap["coins"].length - 1; i >= 0; i--) {
// 		let coin = entitiesMap["coins"][i];
// 		const distanceToPlayer = coin.location.distanceTo(player.location);
// 		if (distanceToPlayer < 2) {
// 			//delete coin from map
// 			let deletedId = entitiesMap["coins"][i].id;
// 			let deletedObject = entitiesMap["coins"].splice(i, i);
// 			//delte from 
// 			for ( let j = 0; j < entities.length; j++) {
// 				if (entities[j].id == deletedId) {
			
// 					entities.splice(j, j);
// 				}
// 			}
// 			//add score
// 			player.addScore();

// 			//update scene
// 			let index = i + 1;
// 			console.log("deleting", "coin".concat(index.toString()))
// 			let toD = scene.getObjectByName("coin".concat(index.toString()));
			

// 			console.log("to be delete", deletedId);
// 			console.log(entities);
// 			console.log(entitiesMap);
// 			console.log(toD);
//     		scene.remove(toD);
// 			const coinNode = gameMap.quantize(player.location);
//       		gameMap.setTileType(coinNode);
// 			//animate();
// 		}
// 	}
// }
function checkCollisions() {
    for (let i = entitiesMap["coins"].length - 1; i >= 0; i--) {
        let coin = entitiesMap["coins"][i];
        if (coin.collected) continue; 

        const distanceToPlayer = coin.location.distanceTo(player.location);
        if (distanceToPlayer < 2) {
            player.addScore();
            scene.remove(coin.gameObject);
            entitiesMap["coins"].splice(i, 1); 
        }
    }
	for (let i = entitiesMap["powerups"].length - 1; i >= 0; i--) {
			let powerup = entitiesMap["powerups"][i];
			const distanceToPlayer = powerup.location.distanceTo(player.location);
			if (distanceToPlayer < 2) { 
				activatePowerUp();
				scene.remove(powerup.gameObject); 
				entitiesMap["powerups"].splice(i, 1); 
			}
	}
	// if (powerUpActive) {
    //     for (let i = entitiesMap["enemies"].length - 1; i >= 0; i--) {
    //         let npc = entitiesMap["enemies"][i];
    //         const distanceToPlayer = npc.location.distanceTo(player.location);
    //         if (distanceToPlayer < 2) { 
    //             scene.remove(npc.gameObject);
    //             entitiesMap["enemies"].splice(i, 1);
    //             console.log("NPC removed due to power-up effect");
    //         }
    //     }
    // }

	
}

function activatePowerUp() {
    powerUpActive = true;
    gameMap.mapRenderer.changeGroundColor(0xff0000); // Change ground to red
	player.addlife();
	//entitiesMap["enemies"].forEach(npc => npc.switchState(new FleeState()));

    setTimeout(() => {
        powerUpActive = false;
	//	entitiesMap["enemies"].forEach(npc => npc.switchState(new WanderState()));
        gameMap.mapRenderer.changeGroundColor(0x0000ff); // Revert ground color
    }, 1000);
}


function gamePlayLoop(deltaTime) {
	//to check how many coins are there and spawn some more if required
	checkSpawns(deltaTime);

	//check health pop ups and spawn more if required
	//checkHealth()

	//check collisions. esp between coins/health with player.
	checkCollisions()

} 

// animate
function animate() {
	if (gameOver) return; 
	requestAnimationFrame(animate);
	renderer.render(scene, camera);
	
	let deltaTime = clock.getDelta();



	gamePlayLoop(deltaTime);


	player.update(deltaTime, gameMap, controller);
	for (let i = 0; i < entitiesMap["enemies"].length;i++) {
		entitiesMap["enemies"][i].update(deltaTime, gameMap, player);

	}

	for (let i = 0; i < entitiesMap["powerups"].length;i++) {
		entitiesMap["powerups"][i].update(deltaTime, gameMap);
		
	}

	for (let i = 0; i < entitiesMap["coins"].length;i++) {
	
		entitiesMap["coins"][i].update(deltaTime, gameMap);
		
	}

	
	if (!player.isAlive()) { 
        gameOver = true;
        alert("Game Over: Player lost all lives!. Refresh page to start new game");
        return; 
    }
	if (player.isScoreReached()) { 
        gameOver = true;
        alert("Game Over: Player Won. Refresh page to start new game");
        return; 
    }



	orbitControls.update();

	let timeElapsed = clock.getElapsedTime();
	// console.log(Math.trunc(timeElapsed));
	if (Math.trunc(timeElapsed) % 5 == 0) {
		//console.log(entitiesMap);
	}

	
}



setup();