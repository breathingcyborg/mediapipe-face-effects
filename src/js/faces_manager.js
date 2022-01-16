
import * as THREE from 'three';
import { PUBLIC_PATH } from './public_path';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { scaleLandmark, makeGeometry } from './landmarks_helpers';

function loadModel( file ) {
  return new Promise( ( res, rej ) => {
      const loader = new GLTFLoader();
      loader.load( file, function ( gltf ) {
        res( gltf.scene );
      }, undefined, function ( error ) {
          rej( error );
      } );
  });
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
    this.loadGlasses();
  }

  async loadGlasses() {
    this.glasses = await loadModel( `${PUBLIC_PATH}/3d/black-glasses/scene.gltf` );
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

  addGlasses() {
    let midEyes = scaleLandmark(this.landmarks[168], this.width, this.height);
    let leftEyeInnerCorner = scaleLandmark(this.landmarks[463], this.width, this.height);
    let rightEyeInnerCorner = scaleLandmark(this.landmarks[243], this.width, this.height);
    let noseBottom = scaleLandmark(this.landmarks[2], this.width, this.height);
    let leftEyeUpper1 = scaleLandmark(this.landmarks[446], this.width, this.height);
    let rightEyeUpper1 = scaleLandmark(this.landmarks[226], this.width, this.height);

    if (this.glasses) {
  
      // position
      this.glasses.position.set(
        midEyes.x,
        midEyes.y,
        midEyes.z,
      )

      // scale to make glasses
      // as wide as distance between
      // left eye corner and right eye corner
      const eyeDist = Math.sqrt(
        ( leftEyeUpper1.x - rightEyeUpper1.x ) ** 2 +
        ( leftEyeUpper1.y - rightEyeUpper1.y ) ** 2 +
        ( leftEyeUpper1.z - rightEyeUpper1.z ) ** 2
      );
      // 1.4 is width of 3d model of glasses
      const scale = eyeDist / 1.4;
      this.glasses.scale.set(scale, scale, scale);

      // use two vectors to rotate glasses
      // Vertical Vector from midEyes to noseBottom
      // is used for calculating rotation around x and z axis
      // Horizontal Vector from leftEyeCorner to rightEyeCorner
      // us use to calculate rotation around y axis
      let upVector = new THREE.Vector3(
        midEyes.x - noseBottom.x,
        midEyes.y - noseBottom.y,
        midEyes.z - noseBottom.z,
      ).normalize();

      let sideVector = new THREE.Vector3(
        leftEyeInnerCorner.x - rightEyeInnerCorner.x,
        leftEyeInnerCorner.y - rightEyeInnerCorner.y,
        leftEyeInnerCorner.z - rightEyeInnerCorner.z,
      ).normalize();

      let zRot = (new THREE.Vector3(1, 0, 0)).angleTo(
        upVector.clone().projectOnPlane(
          new THREE.Vector3(0, 0, 1)
        )
      ) - (Math.PI / 2)

      let xRot = (Math.PI / 2) - (new THREE.Vector3(0, 0, 1)).angleTo(
        upVector.clone().projectOnPlane(
          new THREE.Vector3(1, 0, 0)
        )
      );

      let yRot =  (
        new THREE.Vector3(sideVector.x, 0, sideVector.z)
      ).angleTo(new THREE.Vector3(0, 0, 1)) - (Math.PI / 2);
      
      this.glasses.rotation.set(xRot, yRot, zRot);

      this.scene.add(this.glasses);
    }
  }

  removeGlasses() {
    this.scene.remove(this.glasses);
  }
  
  addFaces() {
    // create faces
    let geometry = makeGeometry(this.landmarks);
    this.faces = new THREE.Mesh(geometry, this.material);
    this.faces.position.set(0, 0, 0);
    this.faces.scale.set(this.width, this.height, this.width);
    this.scene.add(this.faces);
  }

  removeFaces() {
    this.scene.remove(this.faces);
  }

  update() {
    if (this.needsUpdate) {
      if (this.faces != null) {
        this.removeFaces();
        this.removeGlasses();
      }
      if (this.landmarks != null) {
        this.addFaces();
        this.addGlasses();
      }
      this.needsUpdate = false;
    }
  }
}
