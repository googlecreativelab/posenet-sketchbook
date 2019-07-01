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
import oceanPath from '/assets/rothko/3.jpg';
let oceanImage = new Image();
oceanImage.src = oceanPath;

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
  showVideo: false,
  showSideVideo: true,
  backgroundColor: '#002a59',
  boundingBox: {
    showBoundingBox: true,
    boxColor: '#d1a6e8',
    boxStyle: 'solid',
  },
  form: {
    showForm: true,
    formColor: '#a9c0ca',
    formShape: 'surrounding',
    formStyle: 'outline',
  },
  keypoints: {
    showPoints: true,
    pointsColor: '#c88b9d',
    pointsStyle: 'fill',
    pointSize: 5,
  },
};

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
  sketchLoop();
}

export function initSketchGui(gui) {
  gui.open();

  gui.add(sketchGuiState, 'showVideo');
  let sideVideoController = gui.add(sketchGuiState, 'showSideVideo');
  sideVideoController.onChange((newVal) => {
    if (newVal) {
      console.log('SHOW IT');
      livestreamCanvas.style.display = 'inline-block';
    } else {
      console.log('HIDE IT');
      livestreamCanvas.style.display = 'none';
    }
  });

  gui.addColor(sketchGuiState, 'backgroundColor');

  let boundingBox = gui.addFolder('Bounding Box');
  boundingBox.add(sketchGuiState.boundingBox, 'showBoundingBox');
  boundingBox.add(sketchGuiState.boundingBox, 'boxStyle', [
    'solid',
    'outline',
    'image',
  ]);
  boundingBox.addColor(sketchGuiState.boundingBox, 'boxColor');
  boundingBox.open();

  let form = gui.addFolder('Form');
  form.add(sketchGuiState.form, 'showForm');
  form.addColor(sketchGuiState.form, 'formColor');
  form.add(sketchGuiState.form, 'formShape', ['jagged', 'surrounding']);
  form.add(sketchGuiState.form, 'formStyle', ['fill', 'outline']);
  form.open();

  let keypoints = gui.addFolder('Keypoints');
  keypoints.add(sketchGuiState.keypoints, 'showPoints');
  keypoints.addColor(sketchGuiState.keypoints, 'pointsColor');
  keypoints.add(sketchGuiState.keypoints, 'pointsStyle', ['fill', 'outline']);
  keypoints
    .add(sketchGuiState.keypoints, 'pointSize')
    .min(1)
    .max(200)
    .step(1);
  keypoints.open();
}

let pointIndexesInOrder = [1, 2, 4, 6, 8, 10, 16, 15, 9, 7, 5, 3, 1];
let newArray = shuffle(pointIndexesInOrder);

let poses;
let getNewFrame = true;
async function sketchLoop() {
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

  let singlePose = poses[0];
  if (singlePose) {

    ctx.save();
    // Clear canvas with each loop
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background
    ctx.fillStyle = sketchGuiState.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw the video on the canvas
    if (sketchGuiState.showVideo) {
      ctx.save();
      ctx.scale(-1, 1);
      ctx.translate(-canvas.width, 0);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.restore();
    }

    let keypoints = poses[0].keypoints;
    let score = poses[0].score;

    poses.forEach(({score, keypoints}) => {
      if (score >= minPoseConfidence) {
        if (sketchGuiState.boundingBox.showBoundingBox) {
          drawBoundingBox(keypoints, ctx);
        }
      }
    });

    if (score >= minPoseConfidence) {
      if (sketchGuiState.form.showForm) {
        ctx.beginPath();
        ctx.moveTo(keypoints[1].position.x, keypoints[1].position.y);

        if (sketchGuiState.form.formShape == 'jagged') {
          newArray.forEach((index) => {
            ctx.lineTo(
              keypoints[index].position.x,
              keypoints[index].position.y
            );
          });
        } else {
          pointIndexesInOrder.forEach((index) => {
            ctx.lineTo(
              keypoints[index].position.x,
              keypoints[index].position.y
            );
          });
        }

        ctx.closePath();
        ctx.fillStyle = sketchGuiState.form.formColor;
        ctx.strokeStyle = sketchGuiState.form.formColor;
        ctx.lineWidth = 10;

        if (sketchGuiState.form.formStyle == 'fill') {
          ctx.fill();
        } else {
          ctx.stroke();
        }
      }
    }

    if (sketchGuiState.keypoints.showPoints) {
      drawKeypoints(keypoints, minPartConfidence, ctx);
    }
    ctx.restore();
  }

  if (sketchGuiState.showSideVideo) {
    livestreamCtx.save();
    livestreamCtx.scale(-1, 1);
    livestreamCtx.translate(-canvas.width, 0);
    livestreamCtx.drawImage(video, 0, 0, canvas.width, canvas.height);
    livestreamCtx.restore();
  }
  requestAnimationFrame(sketchLoop);
}

function getPerpOfLine(x1, y1, x2, y2) {
  // the two points can not be the same
  let nx = x2 - x1; // as vector
  let ny = y2 - y1;
  const len = Math.sqrt(nx * nx + ny * ny); // length of line
  nx /= len; // make one unit long
  ny /= len; // which we call normalising a vector
  return [-ny, nx]; // return the normal  rotated 90 deg
}

function toTuple({y, x}) {
  return [y, x];
}

function shuffle(array) {
  let currentIndex = array.length,
    temporaryValue,
    randomIndex;

  let newArray = array.slice();
  // While there remain elements to shuffle...
  while (0 !== currentIndex) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = newArray[currentIndex];
    newArray[currentIndex] = newArray[randomIndex];
    newArray[randomIndex] = temporaryValue;
  }

  return newArray;
}

export function drawPoint(ctx, y, x, r, color) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;

  if (sketchGuiState.keypoints.pointsStyle == 'fill') {
    ctx.fill();
  } else if (sketchGuiState.keypoints.pointsStyle == 'outline') {
    ctx.lineWidth = 2;
    ctx.stroke();
  }
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
    drawPoint(
      ctx,
      y * scale,
      x * scale,
      sketchGuiState.keypoints.pointSize,
      sketchGuiState.keypoints.pointsColor
    );
  }
}

/**
 * Draw the bounding box of a pose. For example, for a whole person standing
 * in an image, the bounding box will begin at the nose and extend to one of
 * ankles
 */
export function drawBoundingBox(keypoints, ctx) {
  const boundingBox = poseDetection.getBoundingBox(keypoints);

  let minX, minY, maxX, maxY;
  minX = boundingBox.minX;
  minY = boundingBox.minY;
  maxX = boundingBox.maxX;
  maxY = boundingBox.maxY;

  if (sketchGuiState.boundingBox.boxStyle == 'image') {
    // Top
    ctx.drawImage(oceanImage, 0, 0, videoWidth, minY);

    // Bottom
    ctx.drawImage(oceanImage, 0, maxY, videoWidth, videoHeight - maxY);

    // Right side
    ctx.drawImage(oceanImage, maxX, minY, videoWidth - maxX, maxY - minY);

    // Left side
    ctx.drawImage(oceanImage, 0, minY, minX, maxY - minY);
  } else if (sketchGuiState.boundingBox.boxStyle == 'solid') {
    ctx.fillStyle = sketchGuiState.boundingBox.boxColor;
    ctx.fillRect(minX, minY, maxX - minX, maxY - minY);
  } else if (sketchGuiState.boundingBox.boxStyle == 'outline') {
    ctx.fillStyle = sketchGuiState.boundingBox.boxColor;
    ctx.strokeStyle = sketchGuiState.boundingBox.boxColor;
    ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
  }
}
