import "./styles.css";
import * as THREE from 'three';
import { FacesManager } from './js/faces_manager';
import { VideoBackground } from './js/video_bg';
import { FaceMesh } from '@mediapipe/face_mesh';
import { PUBLIC_PATH } from './js/public_path';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { transformLandmarks } from './js/landmarks_helpers';

const template = `
<div class="video-container">
  <span class="loader">
    Loading ...
  </span>
  <div>
    <h2>Original Video</h2>
    <video class="input_video" controls playsinline>
      <source  src="${PUBLIC_PATH}/video/videoplayback.mp4">
    </video>
  </div>
  <div>
    <h2>Processed Video</h2>
    <canvas class="output_canvas"></canvas>
  </div>
</div>
`;

document.querySelector("#app").innerHTML = template;

const video = document.querySelector('.input_video');
const canvas = document.querySelector('.output_canvas');
const useOrtho = true;
const debug = false;

let faceMesh;
let videoBg;
let facesManager;
let supported = true;

/**
 * Initialize FaceMesh
 **/
async function initFacemesh() {

  faceMesh = new FaceMesh({locateFile: (file) => {
    let url =  `${PUBLIC_PATH}/mediapipe/${file}`;
    return url
  }});

  faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
    useCpuInference: true,
  });

  faceMesh.onResults(onResults);

  await faceMesh.initialize();
}

/**
 * Handle results from three js
 * 
 **/
function onResults({ image, multiFaceLandmarks }) {
  if (videoBg != null && image != null) {
    videoBg.setImage(image);
  }
  if (multiFaceLandmarks != null && facesManager != null) {
    multiFaceLandmarks = multiFaceLandmarks[0]
    multiFaceLandmarks = transformLandmarks(multiFaceLandmarks);
    facesManager.updateLandmarks(multiFaceLandmarks);
  }
}

/**
 *  Send Image to facemesh
 **/
async function sendImage() {
  if (!supported) {
    return;
  }
  requestAnimationFrame(sendImage);

  if (!video) {
    return;
  }

  const isPlaying = !!(video.currentTime > 0 && 
    !video.paused && 
    !video.ended && 
    video.readyState > 2
  )

  if (!isPlaying) {
    return;
  }

  try {
    await faceMesh.send({image: video});
  } catch (e) {
    alert("Not Supported on your device")
    console.error(e);
    supported = false;
  }
}

const cameraDistance = (height, fov) => {
  return (height / 2) / Math.tan((fov/2) * Math.PI / 180);
}

/**
 * Initialize THREE js
 **/
function initThree() {

  // create scene, renderer and camera
  const scene = new THREE.Scene();
  const renderer = new THREE.WebGLRenderer({
    canvas,
    devicePixelRation: window.devicePixelRatio || 1
  });

  const fov = 63;
  let camera;
  let controls;  

  if (useOrtho) {
    camera = new THREE.OrthographicCamera(
      - renderer.domElement.width / 2,
      renderer.domElement.width / 2,
      renderer.domElement.height / 2,
      - renderer.domElement.height / 2,
      -2000, 
      2000
    )
    camera.position.z = 1
  } else {
      camera = new THREE.PerspectiveCamera(
        fov,
        renderer.domElement.width / renderer.domElement.height,
        1.0, // near
        10000, // far
      )
      camera.position.z = cameraDistance(renderer.domElement.height, fov); 
  }

  if (debug) {
    controls = new OrbitControls( camera, renderer.domElement );
    controls.update();  
  }

  // video background for canvas
  videoBg = new VideoBackground(scene, 
    renderer.domElement.width, 
    renderer.domElement.height
  );

  // this component draws faces
  facesManager = new FacesManager(scene, 
    renderer.domElement.width, 
    renderer.domElement.height
  )
  

  // we need canvas size
  // to be equal to video size
  function resizeDisplayToVideoSize(renderer) {
    const canvas = renderer.domElement;

    // update css with to match videoElement
    if (video.clientWidth != canvas.clientWidth
        || video.clientHeight != canvas.clientHeight) {
      const width = video.clientWidth;
      const height = video.clientHeight;
      
      canvas.style.width =  `${width}px`;
      canvas.style.height = `${height}px`;
      return true;
    }

    return false;
  } 

  // we need to resize canvas rendering dimensions
  // when canvas sytling dimensions change
  function resizeRendererToDisplaySize(renderer) {
      resizeDisplayToVideoSize(renderer);

      const canvas = renderer.domElement;

      // canvas has 2 width
      // 1) style width set with style attribute
      // 2) rendering width set with width and height attribute
      // update rendering width to match styling width.
      const width  = canvas.clientWidth | 0;
      const height = canvas.clientHeight | 0;
      const needResize = canvas.width !== width || canvas.height !== height;
      if (needResize) {
        renderer.setSize(width, height, false);
      }
      
      return needResize;
  }

  // Three JS Animation Loop
  function animate() {

    requestAnimationFrame(animate);

    if (controls) {
      controls.update();
    }

    if (resizeRendererToDisplaySize(renderer)) {

      // facemanager needs to scale faces according to 
      // renderer dimensions
      facesManager.updateDimensions(renderer.domElement.width, renderer.domElement.height);

      // update video width and height
      videoBg.updateDimensions(renderer.domElement.width, renderer.domElement.height);

      // camera need to be adjusted according to
      // renderer dimensions
      camera.aspect = video.clientWidth / video.clientHeight;
      if (camera.type == 'OrthographicCamera') {
        camera.top = video.clientHeight / 2
        camera.bottom = -video.clientHeight / 2
        camera.left = -video.clientWidth / 2
        camera.right = video.clientWidth / 2  
      } else {
        camera.position.z = cameraDistance(video.clientHeight, fov);
      }
      camera.updateProjectionMatrix();
    }

    // update video background
    videoBg.update();

    // update faces manager
    facesManager.update();

    // render scene
    renderer.render(scene, camera);
  }

  // start animation loop
  animate();
}


async function main() {
  document.querySelector(".video-container").classList.add("loading");
  initThree();
  await initFacemesh();
  sendImage();
  document.querySelector(".video-container").classList.remove("loading");
}

main();
