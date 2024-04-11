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

	npc1 = new NPC(new THREE.Color(0xff0000),gameMap, player);
	npc1.setModel(resource.get("enemy"));
	npc1.location = gameMap.localize(gameMap.graph.getRandomEmptyTile());

	npc2 = new NPC(new THREE.Color(0xff0000),gameMap, player);
	npc2.setModel(resource.get("powerup"));
	npc2.location = gameMap.localize(gameMap.graph.getRandomEmptyTile());

	npc3 = new NPC(new THREE.Color(0xff0000),gameMap, player);
	npc3.setModel(resource.get("bigenemy"));
	npc3.location = gameMap.localize(gameMap.graph.getRandomEmptyTile());
	// Add the character to the scene
	scene.add(player.gameObject);
	scene.add(npc1.gameObject);
	scene.add(npc2.gameObject);
	scene.add(npc3.gameObject);
	// Get a random starting place for the enemy
	let startPlayer = gameMap.graph.getRandomEmptyTile();
	// this is where we start the player
	player.location = gameMap.localize(startPlayer);
	//First call to animate
	animate();
	
}


// animate
function animate() {
	if (gameOver) return; 
	requestAnimationFrame(animate);
	renderer.render(scene, camera);
	
	let deltaTime = clock.getDelta();
	
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