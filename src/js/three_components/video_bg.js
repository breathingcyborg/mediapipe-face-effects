import * as THREE from 'three';

export class VideoBackground {

  constructor(scene, width, height) {
    this.scene = scene;
    this.image = null;
    this.plane = null;
    this.width = width;
    this.height = height;
    this.imageUpdated = false;
    this.sizeUpdated = false;
  }

  updateDimensions(width, height) {
    this.width = width;
    this.height = height;
    this.sizeUpdated = true;
  }

  setImage(image) {
    this.image = image;
    this.imageUpdated = true;
  }

  createNewPlane() {
    const geometry = this.createGeometry();
    const material = this.createMaterial();
    this.plane = new THREE.Mesh(geometry, material);
    // this.updateDimensions();
    this.addPlaneToScene();
  }

  addPlaneToScene() {
    if (this.plane != null) {
      // this.updateDimensions();
      this.scene.add(this.plane);
      this.plane.position.set(0, 0, 0);
    }
  }

  createGeometry() {
    return new THREE.PlaneGeometry(
      this.width,
      this.height,
    )    
  }

  createMaterial() {
    if (this.image == null) {
      return new THREE.MeshBasicMaterial({
        color: new THREE.Color(0xcccccc)
      });
    }
    let material = new THREE.MeshBasicMaterial({
        map: new THREE.CanvasTexture(this.image),
    });
    return material;
  }

  removePlaneFromScene() {
    this.scene.remove(this.plane);
    this.plane = null;
  }

  update() {
    if (this.plane == null) {
      this.createNewPlane();
    }

    if (this.sizeUpdated) {
      this.removePlaneFromScene();
      this.createNewPlane();
      this.sizeUpdated = false;
      this.imageUpdated = false;
    }

    if (this.imageUpdated) {
      this.plane.material = this.createMaterial();
      this.imageUpdated = false;
    }
  }
}
