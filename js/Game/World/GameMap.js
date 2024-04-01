import { TileNode } from './TileNode.js';
import * as THREE from 'three';
import { MapRenderer } from './MapRenderer';
import { Graph } from './Graph';
import { VectorUtil } from '../../Util/VectorUtil';
import { MazeGenerator } from './MazeGenerator.js';


export class GameMap {
	
	// Constructor for our GameMap class
	constructor() {

		this.start = new THREE.Vector3(-50,0,-35);

		this.width = 100;
		this.depth = 70;
	

		// We also need to define a tile size 
		// for our tile based map
		this.tileSize = 2;

		// Get our columns and rows based on
		// width, depth and tile size
		this.cols = this.width/this.tileSize;
		this.rows = this.depth/this.tileSize;

		// Create our graph
		// Which is an array of nodes
		this.graph = new Graph(this.tileSize, this.cols, this.rows);

		// Create our map renderer
		this.mapRenderer = new MapRenderer(this.start, this.tileSize, this.cols);

		// Goals for multi goal flow field
		this.goals = [];


	}

	// initialize the GameMap
	init(scene) {
		this.scene = scene; 
		this.graph.initGraph();
		this.graph.initEdges();

		let mazeGenerator = new MazeGenerator(this.graph);
		mazeGenerator.generate();

		// Set the game object to our rendering
		this.gameObject = this.mapRenderer.createRendering(this.graph.nodes);
	}



	// Method to get location from a node
	localize(node) {
		let x = this.start.x+(node.x*this.tileSize)+this.tileSize*0.5;
		let y = this.tileSize;
		let z = this.start.z+(node.z*this.tileSize)+this.tileSize*0.5;

		return new THREE.Vector3(x,y,z);
	}

	// Method to get node from a location
	quantize(location) {
		let x = Math.floor((location.x - this.start.x)/this.tileSize);
		let z = Math.floor((location.z - this.start.z)/this.tileSize);
		
		return this.graph.getNode(x,z);
	}


}




















