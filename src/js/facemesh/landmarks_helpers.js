import {
  BufferGeometry,
  Float32BufferAttribute
} from 'three';

import { 
  FACE_MESH_INDEX_BUFFER, 
  FACE_MESH_UV  
} from './face_geom.js';

/**
 * Mediapipe uses different convention for axis
 * than three js. This function adapts mediapipe
 * landmarks for three js.
 * @param {*} landmarks 
 */
export const transformLandmarks = (landmarks) => {
  if (!landmarks) {
    return landmarks;
  }

  let hasVisiblity = !!landmarks.find(l => l.visibility);

  let minZ = 1e-4;

  // currently mediapipe facemesh js
  // has visibility set to undefined
  // so we use a heuristic to set z position of facemesh
  if (hasVisiblity) {
    landmarks.forEach(landmark => {
      let { z, visibility } = landmark;
      z = -z;
      if (z < minZ && visibility) {
        minZ = z
      }
    });
  } else {
    minZ = Math.max(-landmarks[234].z, -landmarks[454].z);
  }
 
  return landmarks.map(landmark => {
    let {x, y, z} = landmark;
    return {
      x: -0.5 + x,
      y: 0.5 - y,
      z: -z - minZ,
      visibility: landmark.visibility,
    }
  });
}

/**
 * Scales landmark by width and height
 * @param {*} landmark 
 * @param {*} width 
 * @param {*} height 
 */
export const scaleLandmark = (landmark, width, height) => {
  let { x, y, z } = landmark;
  return {
    ...landmark,
    x: x * width,
    y: y * height,
    z: z * width,
  }
}

/**
 * makes buffer geometry from facemesh landmarks
 * @param {*} landmarks 
 */
export const makeGeometry = (landmarks) => {
  let geometry = new BufferGeometry();
  
  let vertices = [];
  let uvs = [];

  for(let i = 0; i < 468; i++) {
    let {x, y, z} = landmarks[i];
    let vertex =  [x, y, z];
    vertices.push(...vertex);
  }
  for (let j = 0; j < 468; j++) {
    uvs[j * 2] = FACE_MESH_UV[j][0];
    uvs[j * 2 + 1] = FACE_MESH_UV[j][1];
  }

  geometry.setIndex(FACE_MESH_INDEX_BUFFER);
  geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();

  return geometry;
}
