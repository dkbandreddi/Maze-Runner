import * as THREE from "three";
import { VectorUtil } from "../../Util/VectorUtil.js";
import { Character } from "./Character.js";
import { State } from "./State";
export class NPC extends Character {
  // Character Constructor
  constructor(mColor, gameMap, player, id) {
    super(mColor, id);
    this.gameMap = gameMap;
    this.player = player;
    this.currentPath = { points: [] };
    this.state = new WanderState();
    this.state.enterState(this);
  }

  //function to switch state
  switchState(state, deltaTime) {
    this.state = state;
    this.state.enterState(this, deltaTime);
  }

  update(deltaTime, gameMap, player) {
    super.update(deltaTime, gameMap);
    if (this.state) {
      this.state.updateState(this, deltaTime, gameMap, player);
    }
  }
  
  calculateNewPath() {
    // Get the start node of the path based on the NPC's current location
    const startNode = this.gameMap.quantize(this.location);

    // Get a random empty tile on the game map
    const endNode = this.gameMap.graph.getRandomEmptyTile();

    // Find the shortest path between the start node and the end node using A*
    const pathArray = this.gameMap.astar(startNode, endNode);

    // Convert the path nodes to their corresponding world coordinates and store them in the NPC's current path
    const pathPoints = pathArray.map((node) => this.gameMap.localize(node));
    this.currentPath = { points: pathPoints };
    this.segment = 0;

    // Render the path on the game map
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
  enterState(npc, deltaTime) {}


  updateState(npc, deltaTime, gameMap, player) {
    // Check if the NPC has a current path and if it has points
    if (npc.currentPath && npc.currentPath.points.length > 0) {
      // Calculate the steering force for following the current path
      const steeringForce = npc.simpleFollow(
        npc.currentPath,
        gameMap.tileSize / 2
      );
      // Apply the steering force to the NPC
      npc.applyForce(steeringForce);

      // Check if the NPC has reached the end of the current path
      if (npc.segment >= npc.currentPath.points.length - 1) {
        // Calculate a new path for the NPC
        npc.calculateNewPath();
      }
    } else {
      npc.calculateNewPath();
    }

    // Calculating the distance between the NPC and the player
    const distanceToPlayer = npc.location.distanceTo(player.location);

    const pursuitThreshold = 30;

    if (distanceToPlayer <= pursuitThreshold) {
      // Switch the NPC's state to PursueState and provide the deltaTime
      npc.switchState(new PursueState(), deltaTime);
    }
  }
}

export class PursueState extends State {
  enterState(npc) {
    npc.pursuingPlayer = true;
    this.recalculatePath(npc, npc.gameMap, npc.player);
  }
  updateState(npc, deltaTime, gameMap, player) {
    //exit if the NPC is not pursuing the player.
    if (!npc.pursuingPlayer) return;

    // Check if it's time to recalculate the path or if the current path is invalid.
    if (
      npc.currentPath.points.length === 0 ||
      npc.segment >= npc.currentPath.points.length - 1 ||
      this.shouldRecalculatePath(npc, player)
    ) {
      this.recalculatePath(npc, gameMap, player);
    }

    // If the NPC has a valid path, follow it.
    if (npc.currentPath && npc.currentPath.points.length > 0) {
      const steeringForce = npc.simpleFollow(
        npc.currentPath,
        gameMap.tileSize / 2
      );
      npc.applyForce(steeringForce);
    }

    // If the NPC is close enough to the player, use the pursue steering behavior
    const distanceToPlayer = npc.location.distanceTo(player.location);
    if (distanceToPlayer <= 5) {
      const pursuitSteer = npc.pursue(player, 0.1);
      npc.applyForce(pursuitSteer);
    }

    // If the NPC collides with the player, end the pursue state and move the player to a new location.
    if (distanceToPlayer < 3) {
      const playerNode = gameMap.quantize(player.location);
      gameMap.setTileType(playerNode);
      const newPlayerNode = gameMap.graph.getRandomEmptyTile();
      player.loseLife();
      player.location.copy(gameMap.localize(newPlayerNode));
      player.velocity.set(0, 0, 0);
      npc.pursuingPlayer = false;
      npc.switchState(new WanderState(), deltaTime);
    }
  }


  shouldRecalculatePath(npc, player) {
    // Threshold for movement to consider recalculating the path.
    const movementThreshold = 20;

    // If the NPC has no previous player position, recalculate the path.
    if (!npc.lastPlayerPosition) {
      return true;
    }
    
    // Calculate the distance moved by the player and compare it to the threshold.
    const distanceMoved = player.location.distanceTo(npc.lastPlayerPosition);
    return distanceMoved > movementThreshold;
  }

  recalculatePath(npc, gameMap, player) {
    // Quantize the NPC and player locations to find the start and end nodes.
    const startNode = gameMap.quantize(npc.location);
    const endNode = gameMap.quantize(player.location);
    
    // Use A* to find a path from the start node to the end node.
    const path = gameMap.astar(startNode, endNode);
    
    // If a path is found, update the NPC's current path, segment, and render the path.
    if (path.length > 0) {
      const pathPoints = path.map((node) => gameMap.localize(node));
      
      // Update the NPC's current path, segment, and render the path.
      npc.currentPath = { points: pathPoints };
      npc.segment = 0;
      npc.gameMap.renderPath(path);
      npc.lastPlayerPosition = player.location.clone();
    }
  }
}



export class FleeState extends State {
 constructor() {
       super();
       this.fleeDistance = 10;
  }

   enterState(npc) {
    console.log("NPC is now in FleeState");
    time = 0;
  }

   updateState(npc, deltaTime, gameMap, player) {
    time = time + deltaTime;
    

    npc.applyForce(npc.evade(player, deltaTime));

    const distanceToPlayer = npc.location.distanceTo(player.location);
    if (distanceToPlayer < 3) {
      const EnemyNode = gameMap.quantize(npc.location);
      gameMap.setTileType(EnemyNode);
      const newEnemyNode = gameMap.graph.getRandomEmptyTile();
      //player.loseLife();
      npc.location.copy(gameMap.localize(newEnemyNode));
      npc.velocity.set(0, 0, 0);
      //npc.pursuingPlayer = false;
      //npc.switchState(new WanderState(), deltaTime);
      
      player.addScore();
      
    }
    /*
    const distanceToPlayer = npc.location.distanceTo(player.location);
    
    if (distanceToPlayer <= this.fleeDistance) {
        const evasionForce = npc.evade(player, 0.5);
        npc.applyForce(evasionForce);
    } else {
        npc.switchState(new WanderState()); 
    }


    */
    if (time > 8) {

      npc.switchState(new WanderState()); 
      gameMap.mapRenderer.changeGroundColor(0x0000ff);
      time = 0
    }
  }
 }

