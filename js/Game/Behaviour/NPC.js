import * as THREE from "three";
import { VectorUtil } from "../../Util/VectorUtil.js";
import { Character } from "./Character.js";
import { State } from "./State";
export class NPC extends Character {
  // Character Constructor
  constructor(mColor, gameMap, player) {
    super(mColor);
    this.gameMap = gameMap; // Reference to the GameMap instance for pathfinding
    this.player = player;
    this.currentPath = { points: [] }; // Initialize currentPath with an empty points array
    this.state = new WanderState();
    this.state.enterState(this);
  }

  //function to switch state
  switchState(state, deltaTime) {
    this.state = state;
    this.state.enterState(this, deltaTime);
  }

  update(deltaTime, gameMap, player) {
    console.log(player);
    super.update(deltaTime, gameMap);
    if (this.state) {
      this.state.updateState(this, deltaTime, gameMap, player);
    }
  }
  calculateNewPath() {
    const startNode = this.gameMap.quantize(this.location);
    const endNode = this.gameMap.graph.getRandomEmptyTile(); // For example, change as needed
    const pathArray = this.gameMap.astar(startNode, endNode);
    const pathPoints = pathArray.map((node) => this.gameMap.localize(node));
    this.currentPath = { points: pathPoints };
    this.segment = 0; // Reset segment index if needed

    // New: Render the path on the map
    this.gameMap.renderPath(pathArray);
  }

  flow(gameMap) {
    let node = gameMap.quantize(this.location);

    let steer = new THREE.Vector3();

    if (node != gameMap.goal) {
      let desired = gameMap.flowfield.get(node);
      desired.setLength(this.topSpeed);
      steer = VectorUtil.sub(desired, this.velocity);
    } else {
      let nodeLocation = gameMap.localize(node);
      steer = this.arrive(nodeLocation, gameMap.tileSize / 2);
    }
    return steer;
  }

  interactiveFlow(gameMap, player) {
    let playerNode = gameMap.quantize(player.location);

    if (!gameMap.goals.includes(playerNode)) {
      gameMap.setupSingleGoalFlowField(playerNode);
    }

    return this.flow(gameMap);
  }
}

export class WanderState extends State {
  enterState(npc, deltaTime) {
    // Initialization specific to the WanderState can go here
  }

  updateState(npc, deltaTime, gameMap, player) {
    // Follow the current path if it exists
    if (npc.currentPath && npc.currentPath.points.length > 0) {
      const steeringForce = npc.simpleFollow(
        npc.currentPath,
        gameMap.tileSize / 2
      );
      npc.applyForce(steeringForce);
      // Check if the current segment is the last one in the path
      if (npc.segment >= npc.currentPath.points.length - 1) {
        // Calculate a new path once the current path is completed
        npc.calculateNewPath();
      }
    } else {
      // No current path, calculate a new path
      npc.calculateNewPath();
    }

    // Check for proximity to the player to switch to the PursueState
    const distanceToPlayer = npc.location.distanceTo(player.location);
    const pursuitThreshold = 30; // Distance threshold to start pursuing the player
    console.log(distanceToPlayer);
    if (distanceToPlayer <= pursuitThreshold) {
      // Switch to PursueState

      npc.switchState(new PursueState(), deltaTime);
    }
  }
}

export class PursueState extends State {
  enterState(npc) {
    // Set flag to indicate pursuit is active
    npc.pursuingPlayer = true;
    //  calculate a path to start pursuit
    this.recalculatePath(npc, npc.gameMap, npc.player);
  }
  updateState(npc, deltaTime, gameMap, player) {
    if (!npc.pursuingPlayer) return;

    if (
      npc.currentPath.points.length === 0 ||
      npc.segment >= npc.currentPath.points.length - 1 ||
      this.shouldRecalculatePath(npc, player)
    ) {
      // Recalculate the path to the player
      this.recalculatePath(npc, gameMap, player);
    }
    if (npc.currentPath && npc.currentPath.points.length > 0) {
      const steeringForce = npc.simpleFollow(
        npc.currentPath,
        gameMap.tileSize / 2
      );
      npc.applyForce(steeringForce);
    }
  }

  shouldRecalculatePath(npc, player) {
    const movementThreshold = 20;

    if (!npc.lastPlayerPosition) {
      return true;
    }
    const distanceMoved = player.location.distanceTo(npc.lastPlayerPosition);
    return distanceMoved > movementThreshold;
  }

  recalculatePath(npc, gameMap, player) {
    const startNode = gameMap.quantize(npc.location);
    const endNode = gameMap.quantize(player.location);
    const path = gameMap.astar(startNode, endNode);
    if (path.length > 0) {
      const pathPoints = path.map((node) => gameMap.localize(node));
      npc.currentPath = { points: pathPoints };
      npc.segment = 0;
      npc.gameMap.renderPath(path);
      npc.lastPlayerPosition = player.location.clone();
    }
  }
}



export class EvadeState extends State {
  enterState() {}

  updateState() {}
}
