import * as THREE from 'three';

export class Character {

	// Character Constructor
	constructor(mColor) {
		this.size = 3

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

		this.wanderAngle = null;
	}

	// update character
	update(deltaTime) {
		// update velocity via acceleration
		this.velocity.addScaledVector(this.acceleration, deltaTime);
		if (this.velocity.length() > this.topSpeed) {
			this.velocity.setLength(this.topSpeed);
		}

		// update location via velocity
		this.location.addScaledVector(this.velocity, deltaTime);

		// rotate the character to ensure they face 
		// the direction of movement
		let angle = Math.atan2(this.velocity.x, this.velocity.z);
		this.gameObject.rotation.y = angle;

		this.checkEdges();
		// set the game object position
		this.gameObject.position.set(this.location.x, this.location.y+0.25*this.size, this.location.z);

		this.acceleration.multiplyScalar(0);
	
	}
	// check we are within the bounds of the world
	checkEdges() {
        if (this.location.x < -50) {
            this.location.x = 50;
        } 
        if (this.location.z < -50) {
            this.location.z = 50;
        }
        if (this.location.x > 50) {
            this.location.x = -50;
        }
        if (this.location.z > 50) {
            this.location.z = -50;
        }
    }

	// Apply force to our character
	applyForce(force) {
		// here, we are saying force = force/mass
		force.divideScalar(this.mass);
		// this is acceleration + force/mass
		this.acceleration.add(force);
	}

	// Seek steering behaviour
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

	// Seek steering behaviour
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

	arrive(target, radius) {
  		let desired = new THREE.Vector3();
		desired.subVectors(target, this.location);
		
		// get distance of the desired vector
		// which is the distance to the target
		// length is built in
		let distance = desired.length();

		// if distance is less than radius we want
		// to slow down based on how close we are
		if (distance < radius) {
			let speed = (distance/radius) * this.topSpeed;
			desired.setLength(speed);
		} else {
			desired.setLength(this.topSpeed);
		}
  		
  		// steer = desired velocity - current velocity
  		let steer = new THREE.Vector3();
		steer.subVectors(desired, this.velocity);

		return steer;


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

  	// Get the vector projection for path following
  	// NOTE this is not the mathematically correct
  	// vector projection formula
  	vectorProjectionForPathFollow(start, end, toProject) {
  		let vectorA = new THREE.Vector3();
  		let vectorB = new THREE.Vector3();

  		vectorA.subVectors(toProject, start);
  		vectorB.subVectors(end, start);

  		let theta = vectorA.angleTo(vectorB);

  		// for the mathematically correct vector projection:
  		// let scalarProjection = vectorA.length() * Math.cos(theta)
  		// We are using the absolute value to keep the character
  		// moving in the correct direction (it's kind of hacky)
  		let scalarProjection = Math.abs(vectorA.length() * Math.cos(theta));

  		let vectorProjection = vectorB.clone();
  		vectorProjection.setLength(scalarProjection);

  		return vectorProjection;
  	}

  	// Craig Reynold's path following algorithm
  	reynoldsFollow(path, time, sphere1, sphere2) {
  		let steer = new THREE.Vector3(0,0,0);

  		// Get the start and end of the segment
  		let start = path.points[this.segment];
  		let end = path.points[this.segment+1];

  		// Check the distance between the
  		// current characters location and the
  		// end of the segment
  		let distance = this.location.distanceTo(end);
  		
  		// if the distance is less than a
  		// certain amount (e.g. path.radius*2)
  		// We want to move onto the next segment
  		if (distance < path.radius*2) {

  			if (this.segment == path.points.length-2) {
  				steer = this.arrive(end, 5);
  			} else {
  				this.segment++;
  			}
  			

  		} else {
  			// Otherwise, we want to use our
  			// path following algorithm

  			// Step 1:
  			// Predict a location in the future
  			let prediction = new THREE.Vector3();
  			prediction.addScaledVector(this.velocity, time);
  			prediction.add(this.location);
  			
  			// Step 2: 
  			// Get the pseudo vector projection of the 
  			// prediction onto the path segment
  			let vectorProjection = this.vectorProjectionForPathFollow(start, end, prediction);
  			
  			// Step 3: Set the target to seek
  			// to be a little bit greater than the
  			// vector projection
  			let targetToSeek = vectorProjection.clone();
  			let aLittleBitMore = 3;
  			targetToSeek.setLength(vectorProjection.length() + aLittleBitMore);

  			// Step 4: Add the start of the path to the
  			// vectorProjection and targetToSeek
  			vectorProjection.add(start);
  			targetToSeek.add(start);

  			// These are just used to show the algorithm
  			// in action, comment them out in a real game
  			sphere2.position.set(vectorProjection.x, vectorProjection.y, vectorProjection.z);
  			sphere1.position.set(targetToSeek.x, targetToSeek.y, targetToSeek.z);
  			

  			// Step 5: Check to see if the distance of 
  			// the prediction to the path is
  			// greater than the radius, if so
  			// seek to the target to seek
  			let distanceFromPathToPrediction = prediction.distanceTo(vectorProjection);

  			if (distanceFromPathToPrediction > path.radius) {

          // Step 6: SEEK!
  				steer = this.seek(targetToSeek);

  			}

  		}

  		return steer;
  	}


  	getCollisionPoint(obstaclePosition, obstacleRadius, prediction) {

  		let vectorA = new THREE.Vector3();
  		let vectorB = new THREE.Vector3();
  		// Get the vector between obstacle position and current location
  		vectorA.subVectors(obstaclePosition, this.location);
  		// Get the vector between prediction and current location
  		vectorB.subVectors(prediction, this.location);

  		// find the vector projection
  		let vectorProjection = vectorA.clone();
  		// this method projects vectorProjection (vectorA) onto vectorB 
  		// and sets vectorProjection to the its result
  		vectorProjection.projectOnVector(vectorB);
      
      // ***I forgot this line in class
      // we need to move the vector projection 
      // to start at the correct location!***
      vectorProjection.add(this.location);

  		// get the adjacent using trigonometry
  		let opp = obstaclePosition.distanceTo(vectorProjection);
  		let adj = Math.sqrt((obstacleRadius*obstacleRadius) - (opp*opp));

  		// use scalar projection to get the collision length
  		let scalarProjection = vectorProjection.distanceTo(this.location);
  		let collisionLength = scalarProjection - adj;

  		// find the collision point by setting
  		// velocity to the collision length
  		// then adding the current location
  		let collisionPoint = this.velocity.clone();
  		collisionPoint.setLength(collisionLength);
  		collisionPoint.add(this.location);

  		return collisionPoint;
  	}

  	avoidCollision(obstaclePosition, obstacleRadius, time) {

  		let steer = new THREE.Vector3();

  		let prediction = new THREE.Vector3();
  		prediction.addScaledVector(this.velocity, time);
  		prediction.add(this.location);

  		let collision = CollisionDetector.lineCircle(this.location, prediction, obstaclePosition, obstacleRadius);
  		console.log(collision);
  	
  		// UNFINISHED


  		return steer;

  	}





}