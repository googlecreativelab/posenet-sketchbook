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
let canvas = document.getElementById('output');
let ctx = canvas.getContext('2d');

let livestreamCanvas = document.getElementById('livestream');
let livestreamCtx = livestreamCanvas.getContext('2d');

let poseDetection;
let video;
let videoWidth, videoHeight;

// Speech recognition stuff
var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition;
var SpeechGrammarList = SpeechGrammarList || webkitSpeechGrammarList;
var SpeechRecognitionEvent =
  SpeechRecognitionEvent || webkitSpeechRecognitionEvent;
let recognition = new SpeechRecognition();
recognition.continuous = true;
recognition.lang = 'en-US';
recognition.interimResults = true;
recognition.maxAlternatives = 1;
recognition.start();

let text = '';
let textSize = 18;

recognition.onresult = function(event) {
  let fullTranscript = '';
  for (let r = 0; r < event.results.length; r++) {
    fullTranscript += event.results[r][0].transcript;
  }
  text = fullTranscript;
};

recognition.onend = function(event) {
  console.log('speech recognition ended');
  recognition.start();
};

const color = 'aqua';
const lineWidth = 2;

let sketchGuiState = {
  showVideo: false,
  showSideVideo: true,
  backgroundColor: '#ffe053',
  textColor: '#9d005c',
  keypoints: {
    showPoints: true,
    pointsColor: '#9d005c',
    pointsStyle: 'outline',
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
  gui.addColor(sketchGuiState, 'textColor');

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
    ctx.translate(-videoWidth, 0);
    ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
    ctx.restore();
  }

  // find me
  ctx.textAlign = 'left';
  ctx.fillStyle = sketchGuiState.textColor;
  ctx.font = '20px Helvetica';
  ctx.fillText('speak to add text to form your body!', 10, 25);

  if (singlePose) {
    let keypoints = poses[0].keypoints;

    if (sketchGuiState.keypoints.showPoints) {
      drawKeypoints(keypoints, minPartConfidence, ctx);
    }

    drawTextTorso(
      text,
      singlePose.parts.rightShoulder.position,
      singlePose.parts.leftShoulder.position,
      ctx
    );

    drawTextTorso(
      text,
      singlePose.parts.rightEar.position,
      singlePose.parts.leftEar.position,
      ctx
    );
  }

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

function drawTextTorso(theText, rightShoulder, leftShoulder, ctx) {
  let width = poseDetection.getDistance(rightShoulder, leftShoulder);
  ctx.save();
  ctx.translate(rightShoulder.x + width / 2, rightShoulder.y);
  ctx.font = textSize + 'px Helvetica';
  ctx.fillStyle = sketchGuiState.textColor;
  ctx.textAlign = 'center';
  // ctx.fillText(theText, 0, 0, width);
  wrapText(ctx, theText, 0, 0, width, width * 0.75, 25);
  ctx.restore();
}

function wrapText(context, text, x, y, maxWidth, maxHeight, lineHeight) {
  let words = text.split(' ');
  let line = '';

  for (let n = 0; n < words.length; n++) {
    let testLine = line + words[n] + ' ';
    let metrics = context.measureText(testLine);
    let testWidth = metrics.width;
    if (y + lineHeight < maxHeight) {
      if (testWidth > maxWidth && n > 0) {
        context.fillText(line, x, y);
        line = words[n] + ' ';
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
  }
  context.fillText(line, x, y);
}

function toTuple({y, x}) {
  return [y, x];
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
