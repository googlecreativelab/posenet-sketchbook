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

let sketchGuiState = {
  visual: 'trail',
  backgroundColor: '#152c39',
  backgroundOpacity: 1.0,
  poseColor: '#c8434b',
  showVideo: false,
  showSideVideo: true,
  showSkeleton: true,
  keypoints: {
    showPoints: true,
    pointsStyle: 'fill',
    pointSize: 5,
  },
  trail: {
    numerOfPastPoses: 20,
    poseOffsetX: 0,
    poseOffsetY: 0,
  },
  grid: {
    numberOfRows: 8,
    numberOfColumns: 8,
  },
  paint: {
    lifeSpan: 25,
    colorLerp: false,
  },
};

let pastPoses = [];
let pastPaintedPoses = [];

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
  let visualMode = gui.add(sketchGuiState, 'visual', [
    'trail',
    'paint',
    'grid',
  ]);
  visualMode.onChange((value) => {
    switch (value) {
      case 'trail':
        sketchGuiState.backgroundColor = '#152c39';
        sketchGuiState.poseColor = '#c8434b';
        trail.open();
        grid.close();
        paint.close();
        break;
      case 'grid':
        sketchGuiState.backgroundColor = '#34031a';
        sketchGuiState.poseColor = '#ffb7bc';
        sketchGuiState.keypoints.pointSize = 5;
        trail.close();
        grid.open();
        paint.close();
        break;
      case 'paint':
        sketchGuiState.backgroundColor = '#bae89a';
        sketchGuiState.poseColor = '#062b37';
        sketchGuiState.keypoints.pointSize = 25;
        trail.close();
        grid.close();
        paint.open();
        break;
    }
  });

  gui.addColor(sketchGuiState, 'backgroundColor').listen();
  gui
    .add(sketchGuiState, 'backgroundOpacity')
    .min(0.0)
    .max(1.0)
    .step(0.01);
  gui.addColor(sketchGuiState, 'poseColor').listen();
  gui.add(sketchGuiState, 'showVideo');

  let sideVideoController = gui.add(sketchGuiState, 'showSideVideo');
  sideVideoController.onChange((newVal) => {
    if (newVal) {
      livestreamCanvas.style.display = 'inline-block';
    } else {
      livestreamCanvas.style.display = 'none';
    }
  });

  gui.add(sketchGuiState, 'showSkeleton');

  let keypoints = gui.addFolder('Keypoints');
  keypoints.add(sketchGuiState.keypoints, 'showPoints');
  keypoints.add(sketchGuiState.keypoints, 'pointsStyle', ['fill', 'outline']);
  keypoints
    .add(sketchGuiState.keypoints, 'pointSize')
    .min(1)
    .max(200)
    .step(1);
  keypoints.open();
  let trail = gui.addFolder('Trail');
  trail
    .add(sketchGuiState.trail, 'numerOfPastPoses')
    .min(1)
    .max(20)
    .step(1);

  trail
    .add(sketchGuiState.trail, 'poseOffsetX')
    .min(-50)
    .max(50)
    .step(1);

  trail
    .add(sketchGuiState.trail, 'poseOffsetY')
    .min(-50)
    .max(50)
    .step(1);
  trail.open();

  let grid = gui.addFolder('Grid');
  grid
    .add(sketchGuiState.grid, 'numberOfRows')
    .min(1)
    .max(10)
    .step(1);

  grid
    .add(sketchGuiState.grid, 'numberOfColumns')
    .min(1)
    .max(10)
    .step(1);

  let paint = gui.addFolder('Paint');
  paint
    .add(sketchGuiState.paint, 'lifeSpan')
    .min(1)
    .max(200)
    .step(1);

  paint.add(sketchGuiState.paint, 'colorLerp');
}

async function sketchLoop() {
  let poses = await poseDetection.getPoses();
  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  poses.forEach((p) => {
    let pose = p;
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

    // Draw video in background
    if (sketchGuiState.showVideo) {
      ctx.save();
      ctx.scale(-1, 1);
      ctx.translate(-canvas.width, 0);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.restore();
    }

    // Draw background color on top
    let backgroundColor = hexToRgb(sketchGuiState.backgroundColor);
    let backgroundColorString =
      'rgba(' +
      backgroundColor.r +
      ',' +
      backgroundColor.g +
      ',' +
      backgroundColor.b +
      ',' +
      sketchGuiState.backgroundOpacity +
      ')';
    ctx.fillStyle = backgroundColorString;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (sketchGuiState.visual == 'grid') {
      let numberOfRows = sketchGuiState.grid.numberOfRows;
      let numberOfColumns = sketchGuiState.grid.numberOfColumns;

      // Grid of poses
      for (let i = 0; i < numberOfRows; i++) {
        for (let j = 0; j < numberOfColumns; j++) {
          ctx.save();
          ctx.scale(1 / numberOfRows, 1 / numberOfColumns);
          ctx.translate(i * videoWidth, j * videoHeight);

          // Draw the video on the canvas
          if (sketchGuiState.showVideo) {
            ctx.save();
            ctx.scale(-1, 1);
            ctx.translate(-canvas.width, 0);
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            ctx.restore();
          }

          if (pastPoses[j * i + j]) {
            let score = pastPoses[j * i + j].score;
            let keypoints = pastPoses[j * i + j].keypoints;
            if (score >= minPoseConfidence) {
              if (sketchGuiState.keypoints.showPoints) {
                drawKeypoints(
                  keypoints,
                  sketchGuiState.poseColor,
                  minPartConfidence,
                  ctx
                );
              }
              if (sketchGuiState.showSkeleton) {
                drawSkeleton(
                  keypoints,
                  sketchGuiState.poseColor,
                  minPartConfidence,
                  ctx
                );
              }
            }
          }
          ctx.restore();
        }
      }

      // Update poses
      pastPoses.unshift(pose);
      if (pastPoses.length > numberOfRows * numberOfColumns) {
        pastPoses.pop();
      }
    } else if (sketchGuiState.visual == 'trail') {
      for (let p = 0; p < pastPoses.length; p++) {
        let pastPose = pastPoses[p];
        if (pose && pastPose) {
          let newColor = hexToRgb(sketchGuiState.poseColor);
          let alpha = (pastPoses.length - p) / pastPoses.length;
          let newColorString =
            'rgba(' +
            newColor.r +
            ',' +
            newColor.g +
            ',' +
            newColor.b +
            ',' +
            alpha +
            ')';
          let score = pastPose.score;
          let keypoints = pastPose.keypoints;

          ctx.save();
          ctx.translate(
            p * sketchGuiState.trail.poseOffsetX,
            p * sketchGuiState.trail.poseOffsetY
          );
          ctx.scale(alpha, alpha);
          if (score >= minPoseConfidence) {
            if (sketchGuiState.keypoints.showPoints) {
              drawKeypoints(keypoints, newColorString, minPartConfidence, ctx);
            }
            if (sketchGuiState.showSkeleton) {
              drawSkeleton(keypoints, newColorString, minPartConfidence, ctx);
            }
          }
          ctx.restore();
        }
      }

      // Update poses
      pastPoses.unshift(pose);
      while (pastPoses.length > sketchGuiState.trail.numerOfPastPoses) {
        pastPoses.pop();
      }
    } else if (sketchGuiState.visual == 'paint') {
      for (let p = 0; p < pastPaintedPoses.length; p++) {
        pastPaintedPoses[p].display();
        if (pastPaintedPoses[p].lifeSpan <= 0) {
          pastPaintedPoses.pop();
        }
      }
      // Update poses
      if (pose) {
        pastPoses.unshift(pose);
        let newPaintedPose = new PaintedPose(
          pose,
          minPartConfidence,
          sketchGuiState.poseColor,
          ctx
        );
        pastPaintedPoses.unshift(newPaintedPose);
        if (pastPoses.length > sketchGuiState.trail.numerOfPastPoses) {
          pastPoses.pop();
        }
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

function hexToRgb(hex) {
  let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

function toTuple({y, x}) {
  return [y, x];
}

function drawPoint(ctx, y, x, r, color) {
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
function drawSegment([ay, ax], [by, bx], color, scale, ctx) {
  ctx.beginPath();
  ctx.moveTo(ax * scale, ay * scale);
  ctx.lineTo(bx * scale, by * scale);
  ctx.lineWidth = 5;
  ctx.strokeStyle = color;
  ctx.stroke();
}

/**
 * Draws a pose skeleton by looking up all adjacent keypoints/joints
 */
function drawSkeleton(keypoints, color, minConfidence, ctx, scale = 1) {
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
function drawKeypoints(keypoints, color, minConfidence, ctx, scale = 1) {
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
      color
    );
  }
}

class PaintedPose {
  constructor(pose, minPartConfidence, fillColor, ctx) {
    this.pose = pose;
    this.score = pose.score;
    this.keypoints = pose.keypoints;
    this.color = fillColor;
    this.ctx = ctx;
    this.startingLifeSpan = sketchGuiState.paint.lifeSpan;
    this.lifeSpan = this.startingLifeSpan;
    this.minPartConfidence = minPartConfidence;
  }

  display() {
    this.lifeSpan--;

    let newColor = hexToRgb(this.color);
    let alpha = this.lifeSpan / this.startingLifeSpan;
    let newColorString =
      'rgba(' +
      newColor.r +
      ',' +
      newColor.g +
      ',' +
      newColor.b +
      ',' +
      alpha +
      ')';

    if (sketchGuiState.keypoints.showPoints) {
      drawKeypoints(
        this.keypoints,
        newColorString,
        this.minPartConfidence,
        ctx
      );
    }
    if (sketchGuiState.showSkeleton) {
      drawSkeleton(this.keypoints, newColorString, this.minPartConfidence, ctx);
    }
  }
}
