import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GameMap } from './Game/World/GameMap.js';
import { Character } from './Game/Behaviour/Character.js';
import { NPC } from './Game/Behaviour/NPC.js';
import { Player } from './Game/Behaviour/Player.js';
import { Controller} from './Game/Behaviour/Controller.js';
import { TileNode } from './Game/World/TileNode.js';
import { Resources } from './Util/Resources.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { spawn } from './Game/Behaviour/spawn.js';

// a master array to store references to all entities on map
entities = []
// A map to store reference to entities by their type
entitiesMap = {
	"coins" : [],
	"powerups" : [],
	"player" : [],
	"enemies" : []
}

spawns = []
enemies = []

async function getData(url) {
	const response = await fetch(url);
	
	return response.json();
  }
  
const data = await getData("js/assets.json");

console.log(data)

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

//default spawns
let coin1;
let health1;
let powerup1;



var resource = new Resources(data);

await resource.loadAll();

//console.log("here", resource.get("pacman"));

// Setup our scene
function setup() {
	gameOver = false;

	document.getElementById('timer').innerText = `Timer: ${timeLeft}`;
    document.getElementById('lives').innerText = `Lives: 3`; 
    setInterval(() => {
        if (!gameOver && timeLeft > 0) {
            timeLeft--;
            document.getElementById('timer').innerText = `Timer: ${timeLeft}`;
        } else if (timeLeft === 0) {
            gameOver = true;
            alert("Time's up! Player won! Refresh page to start new game");
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
	player = new Player(new THREE.Color(0xff0000));
	player.setModel(resource.get("sportscar"));
	entities.push(player)

	npc1 = new NPC(new THREE.Color(0xff0000),gameMap, player);
	npc1.setModel(resource.get("enemy"));
	npc1.location = gameMap.localize(gameMap.graph.getRandomEmptyTile());
	entities.push(npc1)
	enemies.push(npc1)
	
	npc2 = new NPC(new THREE.Color(0xff0000),gameMap, player);
	npc2.setModel(resource.get("powerup"));
	npc2.location = gameMap.localize(gameMap.graph.getRandomEmptyTile());
	entities.push(npc2)
	enemies.push(npc2)
	
	npc3 = new NPC(new THREE.Color(0xff0000),gameMap, player);
	npc3.setModel(resource.get("bigenemy"));
	npc3.location = gameMap.localize(gameMap.graph.getRandomEmptyTile());

	entities.push(npc3)
	enemies.push(npc3)

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
	secs = deltaTime.getElapsedTime();
	flag = secs % 7 == 0;

	if (flag && entitiesMap["coins"].length <= 2) {
		m = resource.get("coin");
		let coin = new spawn(new THREE.Color("0x00FF00"), m, "coin");
		entities.push(coin);
		entitiesMap["coin"].push(coin);
	}

	
}

function gamePlayLoop() {
	//to check how many coins are there and spawn some more if required
	checkSpawns()

	//check health pop ups and spawn more if required
	checkHealth()

	//check collisions. esp between coins/health with player.
	checkCollisions()

}

// animate
function animate() {
	if (gameOver) return; 
	requestAnimationFrame(animate);
	renderer.render(scene, camera);
	
	let deltaTime = clock.getDelta();


	gamePlayLoop(deltaTime)


	player.update(deltaTime, gameMap, controller);
	npc1.update(deltaTime, gameMap,player);
	npc2.update(deltaTime, gameMap,player);
	npc3.update(deltaTime, gameMap,player);

	if (!player.isAlive()) { 
        gameOver = true;
        alert("Game Over: Player lost all lives!. Refresh page to start new game");
        return; 
    }


	orbitControls.update();
}



setup();