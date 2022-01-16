import { FaceMesh } from '@mediapipe/face_mesh';
import { PUBLIC_PATH } from '../public_path';
import { transformLandmarks } from './landmarks_helpers';

export class FacemeshLandmarksProvider {
  constructor(callback) {
    this.callback = callback;
    this.faceMesh = null;
  }

  send(image) {
    return this.faceMesh.send({image: image});
  }

  onResults({ image, multiFaceLandmarks }) {
    if (image != null && multiFaceLandmarks != null) {
      multiFaceLandmarks = transformLandmarks(multiFaceLandmarks[0]);
      this.callback({
        image: image,
        landmarks: multiFaceLandmarks
      });
    }
  }

  async initialize() {
    let onResults = this.onResults.bind(this);

    this.faceMesh = new FaceMesh({locateFile: (file) => {
      let url =  `${PUBLIC_PATH}/mediapipe/${file}`;
      return url
    }});
  
    this.faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
      useCpuInference: true,
    });
  
    this.faceMesh.onResults(onResults);
  
    await this.faceMesh.initialize();
  }
}