import * as THREE from 'three';
import { VectorUtil } from '../../Util/VectorUtil.js';

export class Character {

	// Character Constructor
	constructor(mColor, id) {
		this.id = id;
		this.size = 3;

		// Create our cone geometry and material
		let coneGeo = new THREE.ConeGeometry(this.size/2, this.size, 10);
		let coneMat = new THREE.MeshStandardMaterial({color: mColor});
		
		// Create the local cone mesh (of type Object3D)
		let mesh = new THREE.Mesh(coneGeo, coneMat);
		// Increment the y position so our cone is just atop the y origin
		mesh.position.y = mesh.position.y+1;
		// Rotate our X value of the mesh so it is facing the +z axis
		mesh.rotateX(Math.PI/2);

		// Add our mesh to a Group to serve as the game object
		this.gameObject = new THREE.Group();
		this.gameObject.add(mesh);		

		// Initialize movement variables
		this.location = new THREE.Vector3(0,0,0);
		this.velocity = new THREE.Vector3(0,0,0);
		this.acceleration = new THREE.Vector3(0, 0, 0);

		this.topSpeed = 15;
		this.mass = 1;
		this.maxForce = 15;
		this.frictionMagnitude = 0;
	}

	setModel(model) {
		model.position.y = model.position.y+1;
		
		// Bounding box for the object
		var bbox = new THREE.Box3().setFromObject(model);

		// Get the depth of the object for avoiding collisions
		// Of course we could use a bounding box,
		// but for now we will just use one dimension as "size"
		// (this would work better if the model is square)
		let dz = bbox.max.z-bbox.min.z;
		console.log(dz);
		// Scale the object based on how
		// large we want it to be
		let scale = this.size/dz;
		model.scale.set(scale, scale, scale);

        this.gameObject = new THREE.Group();
        this.gameObject.add(model);
    }

	// update character
	update(deltaTime, gameMap) {
		this.physics(gameMap);
	
		this.velocity.addScaledVector(this.acceleration, deltaTime);
	
		if (this.velocity.length() > 0) {
			let angle = Math.atan2(this.velocity.x, this.velocity.z);
			this.gameObject.rotation.y = angle;
	
			if (this.velocity.length() > this.topSpeed) {
				this.velocity.setLength(this.topSpeed);
			} 
	
			this.location.addScaledVector(this.velocity, deltaTime);
		}
	
		this.gameObject.position.set(this.location.x, this.location.y, this.location.z);
		this.acceleration.multiplyScalar(0);
	}
	

	// check edges
	checkEdges(gameMap) {

		let node = gameMap.quantize(this.location);

		let nodeLocation = gameMap.localize(node);

  		if (!node.hasEdgeTo(node.x-1, node.z)) {
  			let nodeEdge = nodeLocation.x - gameMap.tileSize/2;
  			let characterEdge = this.location.x - this.size/2;
  			if (characterEdge < nodeEdge) {
  				this.location.x = nodeEdge + this.size/2;
  			}
  		}

  		if (!node.hasEdgeTo(node.x+1, node.z)) {
			let nodeEdge = nodeLocation.x + gameMap.tileSize/2;
  			let characterEdge = this.location.x + this.size/2;
  			if (characterEdge > nodeEdge) {
  				this.location.x = nodeEdge - this.size/2;
  			}

  		}
		if (!node.hasEdgeTo(node.x, node.z-1)) {
  			let nodeEdge = nodeLocation.z - gameMap.tileSize/2;
  			let characterEdge = this.location.z - this.size/2;
  			if (characterEdge < nodeEdge) {
  				this.location.z = nodeEdge + this.size/2;
  			}
  		}

		if (!node.hasEdgeTo(node.x, node.z+1)) { 
  			let nodeEdge = nodeLocation.z + gameMap.tileSize/2;
  			let characterEdge = this.location.z + this.size/2;
  			if (characterEdge > nodeEdge) {
  				this.location.z = nodeEdge - this.size/2;
  			}
  		}
		

 	}
	seek(target) {
		let desired = new THREE.Vector3();
		desired.subVectors(target, this.location);
		desired.setLength(this.topSpeed);

		let steer = new THREE.Vector3();
		steer.subVectors(desired, this.velocity);

		if (steer.length() > this.maxForce) {
			steer.setLength(this.maxForce);
		}
		return steer;
	}

	// Wander steering behaviour
	wander() {
		let d = 10;
		let r = 10;
		let a = 0.3;

		let futureLocation = this.velocity.clone();
		futureLocation.setLength(d);
		futureLocation.add(this.location);



		if (this.wanderAngle == null) {
			this.wanderAngle = Math.random() * (Math.PI*2);
		} else {
			let change = Math.random() * (a*2) - a;
			this.wanderAngle = this.wanderAngle + change;
		}

		let target = new THREE.Vector3(r*Math.sin(this.wanderAngle), 0, r*Math.cos(this.wanderAngle));
		target.add(futureLocation);
		return this.seek(target);

	}
	flee(target) {
		let flee = this.seek(target).multiplyScalar(-1);
		return flee;
	}
	
	evade(character, time) {
		let evade = this.pursue(character, time).multiplyScalar(-1);
		return evade;
	}


	pursue(character, time) {
		let prediction = new THREE.Vector3(0,0,0);
		prediction.addScaledVector(character.velocity, time);
		prediction.add(character.location);

		return this.seek(prediction);
	}

	// Arrive steering behaviour
	arrive(target, radius) {
		let desired = VectorUtil.sub(target, this.location);

		let distance = desired.length();


		if (distance < radius) {
			let speed = (distance/radius) * this.topSpeed;
			desired.setLength(speed);
			
		} else {
			desired.setLength(this.topSpeed);
		} 

		let steer = VectorUtil.sub(desired, this.velocity);

		return steer;
	}

	// Apply force to our character
	applyForce(force) {
		force.divideScalar(this.mass);
		this.acceleration.add(force);
	}

	// simple physics
	physics(gameMap) {
		this.checkEdges(gameMap);
		// friction

		let friction = this.velocity.clone();
		friction.y = 0;
		friction.multiplyScalar(-1);
		friction.normalize();
		friction.multiplyScalar(this.frictionMagnitude);
		
		this.applyForce(friction)
	}

	// Naive follow path
  	simpleFollow(path, threshold) {

  		let steer = new THREE.Vector3();

  		let distance = new THREE.Vector3();
  		distance.subVectors(path.points[this.segment], this.location);

  		if (distance.length() < threshold) {

  			if (this.segment == path.points.length-1) {
  				steer = this.arrive(path.points[this.segment], threshold);
  			} else {
  				this.segment++;
  			}
  		} else {
  			steer = this.seek(path.points[this.segment]);
  		}

  		return steer;

  	}



}