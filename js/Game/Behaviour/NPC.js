import * as THREE from "three";
import { VectorUtil } from "../../Util/VectorUtil.js";
import { Character } from "./Character.js";
import { State } from "./State";

var time = 0;
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
    const startNode = this.gameMap.quantize(this.location);
    const endNode = this.gameMap.graph.getRandomEmptyTile();
    const pathArray = this.gameMap.astar(startNode, endNode);
    const pathPoints = pathArray.map((node) => this.gameMap.localize(node));
    this.currentPath = { points: pathPoints };
    this.segment = 0;

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
    console.log("NPC is now in WanderState")
  }

  updateState(npc, deltaTime, gameMap, player) {
    if (npc.currentPath && npc.currentPath.points.length > 0) {
      const steeringForce = npc.simpleFollow(
        npc.currentPath,
        gameMap.tileSize / 2
      );
      npc.applyForce(steeringForce);
      if (npc.segment >= npc.currentPath.points.length - 1) {
        npc.calculateNewPath();
      }
    } else {
      npc.calculateNewPath();
    }

    const distanceToPlayer = npc.location.distanceTo(player.location);
    const pursuitThreshold = 30;
    if (distanceToPlayer <= pursuitThreshold) {
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
    if (!npc.pursuingPlayer) return;

    if (
      npc.currentPath.points.length === 0 ||
      npc.segment >= npc.currentPath.points.length - 1 ||
      this.shouldRecalculatePath(npc, player)
    ) {
      this.recalculatePath(npc, gameMap, player);
    }

    if (npc.currentPath && npc.currentPath.points.length > 0) {
      const steeringForce = npc.simpleFollow(
        npc.currentPath,
        gameMap.tileSize / 2
      );
      npc.applyForce(steeringForce);
    }

    const distanceToPlayer = npc.location.distanceTo(player.location);
    // if the distance is less than 5, pursue behavior is used.
    if (distanceToPlayer <= 5) {
      const pursuitSteer = npc.pursue(player, 0.1);
      npc.applyForce(pursuitSteer);
    }
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
    
    if (time > 8) {

      npc.switchState(new WanderState()); 
      gameMap.mapRenderer.changeGroundColor(0x0000ff);
      time = 0
    }
  }
 }

