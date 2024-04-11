import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import { TileNode } from './TileNode.js'

export class MapRenderer {

	constructor(start, tileSize, cols) {

		this.start = start;
		this.tileSize = tileSize;
		this.cols = cols;

		this.groundGeometries = new THREE.BoxGeometry(0,0,0);
		this.wallGeometries = new THREE.BoxGeometry(0,0,0);
		this.groundMaterial = new THREE.MeshStandardMaterial({ color: 0x0000ff });
	
	}

	createRendering(graph) {
		// Iterate over all of the 
		// nodes in our graph
		for (let n of graph) {
			this.createTile(n);

		}

        let wallMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00 }); // Yellow for walls


		let gameObject = new THREE.Group();
		let ground = new THREE.Mesh(this.groundGeometries, this.groundMaterial);
		let walls = new THREE.Mesh(this.wallGeometries, wallMaterial);

		gameObject.add(ground);
		gameObject.add(walls);

		return gameObject;
	}

	createTile(node) {

		let i = node.x;
		let j = node.z;
		let type = node.type;

		let x = (i * this.tileSize) + this.start.x;
		let y = 0;
		let z = (j * this.tileSize) + this.start.z;




		let geometry = new THREE.BoxGeometry(this.tileSize,
											 this.tileSize, 
											 this.tileSize);
		geometry.translate(x + 0.5 * this.tileSize,
						   y + 0.5 * this.tileSize,
						   z + 0.5 * this.tileSize);


		this.groundGeometries = BufferGeometryUtils.mergeGeometries(
										[this.groundGeometries,
										geometry]
									);
		
		this.buildWalls(node, x, y, z);


	}


	buildWalls(node, cx, cy, cz) {
		

		if (!node.hasEdgeTo(node.x-1, node.z)) {
			this.buildWall(cx,
						   1.5 * this.tileSize,
						   cz + 0.5 * this.tileSize,
						   0.5,
						   this.tileSize);

		} 

		if (!node.hasEdgeTo(node.x+1, node.z)) {
			this.buildWall(cx + this.tileSize,
						   1.5 * this.tileSize,
						   cz + 0.5 * this.tileSize,
						   0.5,
						   this.tileSize);

		}

		if (!node.hasEdgeTo(node.x, node.z-1)) {
			this.buildWall(cx + 0.5 * this.tileSize,
						   1.5 * this.tileSize,
						   cz,
						   this.tileSize,
						   0.5);

		}

		if (!node.hasEdgeTo(node.x, node.z+1)) {
			this.buildWall(cx + 0.5 * this.tileSize,
						   1.5 * this.tileSize,
						   cz + this.tileSize,
						   this.tileSize,
						   0.5);

		}

	}

	buildWall(px, py, pz, sx, sz) {
		let wall = new THREE.BoxGeometry(sx, this.tileSize, sz);
		wall.translate(px, py, pz);

		this.wallGeometries = 
			BufferGeometryUtils.mergeGeometries(
			[this.wallGeometries, wall]);
	}

	// Debug method
	highlight(vec, color) {
		let geometry = new THREE.BoxGeometry( this.tileSize, 1, this.tileSize ); 
		let material = new THREE.MeshBasicMaterial( { color: color } ); 
		
		geometry.translate(vec.x, vec.y+0.5, vec.z);
		this.flowfieldGraphics.add(new THREE.Mesh( geometry, material ));
		
	}
	changeGroundColor(colorHex) {
        this.groundMaterial.color.set(colorHex);
    }


}