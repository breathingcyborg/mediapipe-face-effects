export class VideoFrameProvider {
  constructor(videoElement, onFrame) {
    this.videoElement = videoElement;
    this.onFrame = onFrame;
    this.running = false;
  }

  start() {
    this.running = true;
    let callback = this.onFrame;
    let video = this.videoElement;
    let _this = this;
  
    const loop = () => {
      requestAnimationFrame(loop);
      if (!video || !_this.running) {
        return;
      }
      callback(video);
    }
    loop();
  }

  stop() {
    this.running = false;
  }
}