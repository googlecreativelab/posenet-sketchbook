/**
 * @license
 * Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */
import {Howl} from 'howler';
import Music from '../assets/jazz.mp3';

let canvas = document.getElementById('output');
let ctx = canvas.getContext('2d');

let livestreamCanvas = document.getElementById('livestream');
let livestreamCtx = livestreamCanvas.getContext('2d');

let poseDetection;
let video;
let videoWidth, videoHeight;

const color = 'aqua';
const lineWidth = 2;

let sketchGuiState = {
  showSideVideo: true,
  showVideo: true,
  opacity: 0.8,
  grayscale: false,
  showControlPoint: true,
  leftColor: '#f706e9',
  rightColor: '#08e0ed'
};

let recording = false;

let micRecording;
let handleSuccess = function(stream) {
  const mediaRecorder = new MediaRecorder(stream);
  // mediaRecorder.start();

  let audioChunks = [];
  mediaRecorder.addEventListener('dataavailable', (event) => {
    audioChunks.push(event.data);
  });

  mediaRecorder.addEventListener('stop', () => {
    const audioBlob = new Blob(audioChunks);
    const audioUrl = URL.createObjectURL(audioBlob);

    micRecording = new Howl({
      src: [audioUrl],
      format: 'm4a',
      loop: true,
    });
    micRecording.play();
  });

  let recordButton = document.getElementById('record');
  recordButton.addEventListener('click', () => {
    recording = !recording;
    console.log('recording: ', recording);

    if (!recording) {
      mediaRecorder.stop();
      recordButton.innerHTML = 'Record with Mic';
    } else {
      mediaRecorder.start();
      if (micRecording) {
        micRecording.stop();
        // Clear audio chunks
        audioChunks = [];
      }
      recordButton.innerHTML = 'Stop and Play';
    }
  });

  let musicButton = document.getElementById('music');
  musicButton.addEventListener('click', () => {
    if (micRecording) {
      micRecording.stop();
    }

    if (music.playing()) {
      musicButton.innerHTML = 'Play Music';
      music.stop();
    } else {
      musicButton.innerHTML = 'Stop Music';
      music.play();
    }
  });
};

navigator.mediaDevices
  .getUserMedia({audio: true, video: false})
  .then(handleSuccess);

let music;
let getNewFrame = true;

export function setupSketch(
  thePoseDetection,
  theVideo,
  theVideoWidth,
  theVideoHeight
) {
  poseDetection = thePoseDetection;
  video = theVideo;
  videoWidth = theVideoWidth;
  videoHeight = theVideoHeight;

  canvas.width = videoWidth;
  canvas.height = videoHeight;

  livestreamCanvas.width = videoWidth;
  livestreamCanvas.height = videoHeight;

  music = new Howl({
    src: [Music],
  });
  
  sketchLoop();
}

  export function initSketchGui(gui) {
  gui.open();

  let sideVideoController = gui.add(sketchGuiState, 'showSideVideo');
  sideVideoController.onChange((newVal) => {
    if (newVal) {
      livestreamCanvas.style.display = 'inline-block';
    } else {
      livestreamCanvas.style.display = 'none';
    }
  });

  gui.add(sketchGuiState, 'showVideo');
  gui
    .add(sketchGuiState, 'opacity')
    .min(0)
    .max(1)
    .step(0.1);
  gui.add(sketchGuiState, 'grayscale');

  gui.add(sketchGuiState, 'showControlPoint');
  gui.addColor(sketchGuiState, 'leftColor');
  gui.addColor(sketchGuiState, 'rightColor');
}

let poses;
async function sketchLoop() {
  // TO DO: get rid of await asynchronous deal outside of posenet

  if (getNewFrame) {
    poses = await poseDetection.getPoses();
  }
  getNewFrame = !getNewFrame;

  let minPoseConfidence;
  let minPartConfidence;

  switch (poseDetection.guiState.algorithm) {
    case 'single-pose':
      minPoseConfidence = +poseDetection.guiState.singlePoseDetection
        .minPoseConfidence;
      minPartConfidence = +poseDetection.guiState.singlePoseDetection
        .minPartConfidence;
      break;
    case 'multi-pose':
      minPoseConfidence = +poseDetection.guiState.multiPoseDetection
        .minPoseConfidence;
      minPartConfidence = +poseDetection.guiState.multiPoseDetection
        .minPartConfidence;
      break;
  }

  ctx.save();
  // Clear canvas with each loop
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw the video on the canvas
  if (sketchGuiState.showVideo) {
    ctx.save();
    ctx.scale(-1, 1);
    ctx.translate(-canvas.width, 0);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  poses.forEach(({parts}) => {
    if (parts) {
      let nose = parts.nose;
      let noseY = nose.position.y;
      let noseX = nose.position.x;

      if (sketchGuiState.grayscale) {
        ctx.fillStyle =
          'hsla(' +
          noseX +
          ',0%,' +
          (1 - (noseX / canvas.height)) * 100 +
          '%,' +
          sketchGuiState.opacity +
          ')';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else {
        let newHexString = lerpColor(
          sketchGuiState.leftColor,
          sketchGuiState.rightColor,
          noseX / videoWidth
        );
        let newRGBString = hexToRgb(newHexString);

        let newColorString;
        if (newRGBString) {
          newColorString =
            'rgba(' +
            newRGBString.r +
            ',' +
            newRGBString.g +
            ',' +
            newRGBString.b +
            ',' +
            sketchGuiState.opacity
            ')';
        }
        ctx.fillStyle = newColorString;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      if (sketchGuiState.showControlPoint) {
        ctx.beginPath();
        ctx.arc(noseX, noseY, 10, 0, 2 * Math.PI);
        ctx.fillStyle = 'white';
        ctx.fill();
      }

      let newVolume = scale(nose.position.x, 0, canvas.height, 1, 0);
      let rangeOffset = 200;
      let newRate = scale(nose.position.y, rangeOffset, canvas.height - rangeOffset, 1.5, 0.5);
      if (micRecording && micRecording.playing()) {
        micRecording.volume(newVolume);
        micRecording.rate(newRate);
      } else if (music && music.playing()) {
        music.volume(newVolume);
        music.rate(newRate);
      }
    }
  });
  ctx.restore();

  if (sketchGuiState.showSideVideo) {
    livestreamCtx.save();
    livestreamCtx.scale(-1, 1);
    livestreamCtx.translate(-canvas.width, 0);
    livestreamCtx.drawImage(video, 0, 0, canvas.width, canvas.height);
    livestreamCtx.restore();
  }
  requestAnimationFrame(sketchLoop);
}

const scale = (num, in_min, in_max, out_min, out_max) => {
  return ((num - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min;
};

function toTuple({y, x}) {
  return [y, x];
}

export function drawPoint(ctx, y, x, r, color) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
}

/**
 * Draws a line on a canvas, i.e. a joint
 */
export function drawSegment([ay, ax], [by, bx], color, scale, ctx) {
  ctx.beginPath();
  ctx.moveTo(ax * scale, ay * scale);
  ctx.lineTo(bx * scale, by * scale);
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = color;
  ctx.stroke();
}

/**
 * Draws a pose skeleton by looking up all adjacent keypoints/joints
 */
export function drawSkeleton(keypoints, minConfidence, ctx, scale = 1) {
  const adjacentKeyPoints = poseDetection.getAdjacentKeyPoints(
    keypoints,
    minConfidence
  );

  adjacentKeyPoints.forEach((keypoints) => {
    drawSegment(
      toTuple(keypoints[0].position),
      toTuple(keypoints[1].position),
      color,
      scale,
      ctx
    );
  });
}

/**
 * Draw pose keypoints onto a canvas
 */
export function drawKeypoints(keypoints, minConfidence, ctx, scale = 1) {
  for (let i = 0; i < keypoints.length; i++) {
    const keypoint = keypoints[i];

    if (keypoint.score < minConfidence) {
      continue;
    }

    const {y, x} = keypoint.position;
    drawPoint(ctx, y * scale, x * scale, 5, color);
  }
}


/**
 * A linear interpolator for hexadecimal colors
 * @param {String} a
 * @param {String} b
 * @param {Number} amount
 * @example
 * // returns #7F7F7F
 * lerpColor('#000000', '#ffffff', 0.5)
 * @returns {String}
 */
function lerpColor(a, b, amount) {
  let ah = +a.replace('#', '0x'),
    ar = ah >> 16,
    ag = (ah >> 8) & 0xff,
    ab = ah & 0xff,
    bh = +b.replace('#', '0x'),
    br = bh >> 16,
    bg = (bh >> 8) & 0xff,
    bb = bh & 0xff,
    rr = ar + amount * (br - ar),
    rg = ag + amount * (bg - ag),
    rb = ab + amount * (bb - ab);
  return (
    '#' + (((1 << 24) + (rr << 16) + (rg << 8) + rb) | 0).toString(16).slice(1)
  );
}

function hexToRgb(hex) {
  // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
  let shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, function(m, r, g, b) {
    return r + r + g + g + b + b;
  });

  let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}
