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
// Keith Haring
// import head1 from "/assets/bodyparts/head.png";
// import leftForearm1 from "/assets/bodyparts/leftForearm.png";
// import leftShin1 from "/assets/bodyparts/leftShin.png";
// import leftThigh1 from "/assets/bodyparts/leftThigh.png";
// import leftUpperarm1 from "/assets/bodyparts/leftUpperarm.png";
// import rightForearm1 from "/assets/bodyparts/rightForearm.png";
// import rightShin1 from "/assets/bodyparts/rightShin.png";
// import rightThigh1 from "/assets/bodyparts/rightThigh.png";
// import rightUpperarm1 from "/assets/bodyparts/rightUpperarm.png";
// import torso1 from "/assets/bodyparts/torso.png";

// Emojis
import head0 from '../assets/bodypieces/head/1.png';
import leftForearm0 from '../assets/bodypieces/leftForearm/1.png';
import leftShin0 from '../assets/bodypieces/leftShin/1.png';
import leftThigh0 from '../assets/bodypieces/leftThigh/1.png';
import leftUpperarm0 from '../assets/bodypieces/leftUpperarm/1.png';
import rightForearm0 from '../assets/bodypieces/rightForearm/1.png';
import rightShin0 from '../assets/bodypieces/rightShin/1.png';
import rightThigh0 from '../assets/bodypieces/rightThigh/1.png';
import rightUpperarm0 from '../assets/bodypieces/rightUpperarm/1.png';
import torso0 from '../assets/bodypieces/torso/1.png';

// Moby Dick
// import head2 from "/assets/bodyparts/head/head-2.png";
// import leftForearm2 from "/assets/bodyparts/leftForearm/leftForearm-2.png";
// import leftShin2 from "/assets/bodyparts/leftShin/leftShin-2.png";
// import leftThigh2 from "/assets/bodyparts/leftThigh/leftThigh-2.png";
// import leftUpperarm2 from "/assets/bodyparts/leftUpperarm/leftUpperarm-2.png";
// import rightForearm2 from "/assets/bodyparts/rightForearm/rightForearm-2.png";
// import rightShin2 from "/assets/bodyparts/rightShin/rightShin-2.png";
// import rightThigh2 from "/assets/bodyparts/rightThigh/rightThigh-2.png";
// import rightUpperarm2 from "/assets/bodyparts/rightUpperarm/rightUpperarm-2.png";
// import torso2 from "/assets/bodyparts/torso/torso-2.png";

let headPaths = [head0];
let heads = [];
headPaths.forEach((path) => {
  let img = new Image();
  img.src = path;
  heads.push(img);
});

let torsoPaths = [torso0];
let torsos = [];
torsoPaths.forEach((path) => {
  let img = new Image();
  img.src = path;
  torsos.push(img);
});

let leftForearmPaths = [leftForearm0];
let leftForearms = [];
leftForearmPaths.forEach((path) => {
  let img = new Image();
  img.src = path;
  leftForearms.push(img);
});

let leftShinPaths = [leftShin0];
let leftShins = [];
leftShinPaths.forEach((path) => {
  let img = new Image();
  img.src = path;
  leftShins.push(img);
});

let leftThighPaths = [leftThigh0];
let leftThighs = [];
leftThighPaths.forEach((path) => {
  let img = new Image();
  img.src = path;
  leftThighs.push(img);
});

let leftUpperarmPaths = [leftUpperarm0];
let leftUpperarms = [];
leftUpperarmPaths.forEach((path) => {
  let img = new Image();
  img.src = path;
  leftUpperarms.push(img);
});

let rightForearmPaths = [rightForearm0];
let rightForearms = [];
rightForearmPaths.forEach((path) => {
  let img = new Image();
  img.src = path;
  rightForearms.push(img);
});

let rightShinPaths = [rightShin0];
let rightShins = [];
rightShinPaths.forEach((path) => {
  let img = new Image();
  img.src = path;
  rightShins.push(img);
});

let rightThighPaths = [rightThigh0];
let rightThighs = [];
rightThighPaths.forEach((path) => {
  let img = new Image();
  img.src = path;
  rightThighs.push(img);
});

let rightUpperarmPaths = [rightUpperarm0];
let rightUpperarms = [];
rightUpperarmPaths.forEach((path) => {
  let img = new Image();
  img.src = path;
  rightUpperarms.push(img);
});

let canvas = document.getElementById('output');
let ctx = canvas.getContext('2d');

let livestreamCanvas = document.getElementById('livestream');
let livestreamCtx = livestreamCanvas.getContext('2d');

let poseDetection;
let video;
let videoWidth, videoHeight;

let sketchGuiState = {
  showVideo: false,
  showSideVideo: true,
  backgroundColor: '#ac4eff',
  collageIndex: 0,
  keypoints: {
    showPoints: true,
    pointsColor: '#ffef7a',
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
      livestreamCanvas.style.display = 'inline-block';
    } else {
      livestreamCanvas.style.display = 'none';
    }
  });

  gui.addColor(sketchGuiState, 'backgroundColor');
  // gui.add(sketchGuiState, "collageIndex", [0, 1, 2]);

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

  poses.forEach((pose) => {
    let singlePose = pose;
    let distanceScale = poseDetection.getDistance(
      singlePose.parts.leftEye.position,
      singlePose.parts.leftEar.position
    );

    let keypoints = pose.keypoints;
    let score = pose.score;

    // Adjust confidence per pose
    
    // Left arm
    drawLimb(
      singlePose.parts.leftShoulder,
      singlePose.parts.leftElbow,
      minPartConfidence,
      leftUpperarms[sketchGuiState.collageIndex],
      ctx
    );
    drawLimb(
      singlePose.parts.leftElbow,
      singlePose.parts.leftWrist,
      minPartConfidence,
      leftForearms[sketchGuiState.collageIndex],
      ctx
    );

    // Right arm
    drawLimb(
      singlePose.parts.rightElbow,
      singlePose.parts.rightWrist,
      minPartConfidence,
      rightForearms[sketchGuiState.collageIndex],
      ctx
    );
    drawLimb(
      singlePose.parts.rightShoulder,
      singlePose.parts.rightElbow,
      minPartConfidence,
      rightUpperarms[sketchGuiState.collageIndex],
      ctx
    );

    // Left leg
    drawLimb(
      singlePose.parts.leftHip,
      singlePose.parts.leftKnee,
      minPartConfidence,
      leftThighs[sketchGuiState.collageIndex],
      ctx
    );
    drawLimb(
      singlePose.parts.leftKnee,
      singlePose.parts.leftAnkle,
      minPartConfidence,
      leftShins[sketchGuiState.collageIndex],
      ctx
    );

    // Right leg
    drawLimb(
      singlePose.parts.rightHip,
      singlePose.parts.rightKnee,
      minPartConfidence,
      rightThighs[sketchGuiState.collageIndex],
      ctx
    );
    drawLimb(
      singlePose.parts.rightKnee,
      singlePose.parts.rightAnkle,
      minPartConfidence,
      rightShins[sketchGuiState.collageIndex],
      ctx
    );

    let torsoImage = torsos[sketchGuiState.collageIndex];

    // Torso
    ctx.drawImage(
      torsoImage,
      singlePose.parts.rightShoulder.position.x,
      singlePose.parts.rightShoulder.position.y,
      poseDetection.getDistance(
        singlePose.parts.leftShoulder.position,
        singlePose.parts.rightShoulder.position
      ),
      poseDetection.getDistance(
        singlePose.parts.leftShoulder.position,
        singlePose.parts.leftHip.position
      )
    );

    let headImage = heads[sketchGuiState.collageIndex];

    // Head
    let headWidth = poseDetection.getDistance(
      singlePose.parts.leftEar.position,
      singlePose.parts.rightEar.position
    );

    let headHeight = poseDetection.getDistance(
      singlePose.parts.rightEye.position,
      singlePose.parts.rightShoulder.position
    );

    ctx.drawImage(
      headImage,
      singlePose.parts.nose.position.x - headWidth / 2,
      singlePose.parts.leftEye.position.y - headHeight / 2,
      headWidth,
      headHeight
    );
    if (sketchGuiState.keypoints.showPoints) {
      drawKeypoints(keypoints, minPartConfidence, ctx);
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

function drawLimb(part1, part2, minPartConfidence, theImage, ctx) {
  let pos1 = part1.position;
  let pos2 = part2.position;

  if (part1.score > minPartConfidence && part2.score > minPartConfidence) {
    let img = theImage;

    let c = poseDetection.getDistance(pos1, pos2);
    let d = Math.sqrt(
      Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y + c - pos2.y, 2)
    );
    let rotation = Math.acos(1 - Math.pow(d, 2) / (2 * Math.pow(c, 2)));
    if (pos2.x > pos1.x) {
      rotation *= -1;
    }

    let w = (img.width * c) / img.height;
    ctx.save();
    ctx.translate(pos1.x, pos1.y);
    ctx.rotate(rotation);
    ctx.drawImage(img, 0, 0, w, c);
    ctx.restore();
  }
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
    ctx.stroke();
  }
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
