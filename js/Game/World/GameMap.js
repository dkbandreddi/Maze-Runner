import { TileNode } from "./TileNode.js";
import * as THREE from "three";
import { MapRenderer } from "./MapRenderer";
import { Graph } from "./Graph";
import { VectorUtil } from "../../Util/VectorUtil";
import { MazeGenerator } from "./MazeGenerator.js";
import { PriorityQueue } from "../../Util/PriorityQueue.js";

export class GameMap {
  // Constructor for our GameMap class
  constructor() {
    this.start = new THREE.Vector3(-50, 0, -35);

    this.width = 60;
    this.depth = 60;

    // We also need to define a tile size
    // for our tile based map
    this.tileSize = 5;

    // Get our columns and rows based on
    // width, depth and tile size
    this.cols = this.width / this.tileSize;
    this.rows = this.depth / this.tileSize;

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
  
  renderPath(path) {
    const geometry = new THREE.SphereGeometry(1);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 }); 
    if (this.pathMarkers) {
      this.pathMarkers.forEach((marker) => {
        this.scene.remove(marker);
      });
    }
    this.pathMarkers = [];

    path.forEach((node) => {
      const nodePosition = this.localize(node);
      const sphere = new THREE.Mesh(geometry, material);
      sphere.position.set(nodePosition.x, nodePosition.y, nodePosition.z);
      this.scene.add(sphere);
      this.pathMarkers.push(sphere); 
    });
  }

  // Method to get location from a node
  localize(node) {
    let x = this.start.x + node.x * this.tileSize + this.tileSize * 0.5;
    let y = this.tileSize;
    let z = this.start.z + node.z * this.tileSize + this.tileSize * 0.5;

    return new THREE.Vector3(x, y, z);
  }

  // Method to get node from a location
  quantize(location) {
    let x = Math.floor((location.x - this.start.x) / this.tileSize);
    let z = Math.floor((location.z - this.start.z) / this.tileSize);

    return this.graph.getNode(x, z);
  }

  manhattanDistance(node, end) {
    const nodePosition = this.localize(node);
    const endPosition = this.localize(end);
    const dx = Math.abs(nodePosition.x - endPosition.x);
    const dz = Math.abs(nodePosition.z - endPosition.z);
    return dx + dz;
  }

  astar(startNode, endNode) {
    const openList = new PriorityQueue();
    const closedList = new Set();
    const parents = new Map();
    const gScores = new Map();
    startNode.g = 0;
    startNode.h = this.manhattanDistance(startNode, endNode);
    startNode.f = startNode.g + startNode.h;
    gScores.set(startNode, startNode.g);
    openList.enqueue(startNode, startNode.f);

    while (!openList.isEmpty()) {
      const currentNode = openList.dequeue();

      if (currentNode === endNode) {
        return this.backtrack(parents, startNode, endNode);
      }

      closedList.add(currentNode);

      for (const edge of currentNode.edges) {
        const neighbor = edge.node;

        if (closedList.has(neighbor)) {
          continue;
        }

        const tentativeGScore = gScores.get(currentNode) + edge.cost;
        if (!openList.includes(neighbor)) {
          openList.enqueue(
            neighbor,
            tentativeGScore + this.manhattanDistance(neighbor, endNode)
          );
        } else if (tentativeGScore >= gScores.get(neighbor)) {
          continue; // This is not a better path.
        }

        // This path is the best until now. Record it!
        parents.set(neighbor, currentNode);
        gScores.set(neighbor, tentativeGScore);
        neighbor.f =
          tentativeGScore + this.manhattanDistance(neighbor, endNode); // Update f value
      }
    }
    return []; // Failed to find a path
  }

  backtrack(parents, startNode, endNode) {
    const path = [];
    let currentNode = endNode;

    while (currentNode !== startNode) {
      path.unshift(currentNode);
      currentNode = parents.get(currentNode);
    }

    path.unshift(startNode); // Add the start node at the beginning
    return path;
  }


  setTileType(node) {
	  this.mapRenderer.createTile(node);	
	}
}
