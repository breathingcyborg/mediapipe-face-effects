
import * as THREE from 'three';

import { 
  FACE_MESH_INDEX_BUFFER, 
  FACE_MESH_UV  
} from './face_geom.js';

const makeGeometry = (landmarks, width, height, zScale = 5) => {
  let geometry = new THREE.BufferGeometry();
  
  let vertices = [];
  let uvs = [];
  for(let i = 0; i < 468; i++) {
    let {x, y, z} = landmarks[i];
    x = (-0.5 + x) * width;
    y = ( 0.5 - y) * height;
    z = ((-z + 0.5) * zScale)
    let vertex =  [x, y, z];
    vertices.push(...vertex);
  }
  for (let j = 0; j < 468; j++) {
    uvs[j * 2] = FACE_MESH_UV[j][0];
    uvs[j * 2 + 1] = FACE_MESH_UV[j][1];
  }

  geometry.setIndex(FACE_MESH_INDEX_BUFFER);
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();

  return geometry;
}

export class FacesManager {
  constructor(scene, width, height) {
    this.scene = scene;
    this.needsUpdate = false;
    this.landmarks = null;
    this.faces = null;
    this.width = width;
    this.height = height;
    this.material = new THREE.MeshNormalMaterial();
  }

  updateDimensions(width, height) {
    this.width = width;
    this.height = height;
    this.needsUpdate = true;
  }

  updateLandmarks(landmarks) {
    this.landmarks = landmarks;
    this.needsUpdate = true;
  }

  updateMaterial(material) {
    this.material = material;
    this.material.needsUpdate = true;
  }
  
  addFaces() {
    let geometry = makeGeometry(
      this.landmarks, 
      this.width, 
      this.height, 
      this.width
    );
    this.faces = new THREE.Mesh(geometry, this.material);
    this.faces.position.set(0, 0, 0)
    this.scene.add(this.faces);
  }

  removeFaces() {
    this.scene.remove(this.faces);
  }

  update() {
    if (this.needsUpdate) {
      if (this.faces != null) {
        this.removeFaces();
      }
      if (this.landmarks != null) {
        this.addFaces();
      }
      this.needsUpdate = false;
    }
  }
}
