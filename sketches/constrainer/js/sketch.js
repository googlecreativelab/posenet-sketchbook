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
import oceanPath from "/assets/ocean.jpg";
let oceanImage = new Image();
oceanImage.src = oceanPath;

// Background
import parks1 from "/assets/parks/1.jpg";
let parksImage = new Image();
parksImage.src = parks1;

// Bounding Images
import sugimoto1 from "/assets/sugimoto/1.jpg";
let sugimotoImage = new Image();
sugimotoImage.src = sugimoto1;

import moby1 from "/assets/bodyparts/head/head-2.png";
let mobyImage = new Image();
mobyImage.src = moby1;

import bill1 from "/assets/billface.png";
let billImage = new Image();
billImage.src = bill1;

let canvas = document.getElementById("output");
let ctx = canvas.getContext("2d");

let livestreamCanvas = document.getElementById("livestream");
let livestreamCtx = livestreamCanvas.getContext("2d");

let poseDetection;
let video;
let videoWidth, videoHeight;

const color = "aqua";
const lineWidth = 2;

let sketchGuiState = {
  canvasScale: 1,
  showVideo: false,
  showSideVideo: true,
  backgroundColor: "#ffffff",
  background: "solid color",
  boundingBox: {
    showBoundingBox: true,
    boxColor: "#d1a6e8",
    boxStyle: "text",
    surround: "full-body"
  },
  text: {
    showText: true,
    wordOptions: "repeat",
    splitOptions: "word",
    reverseOrder: false,
    wordSource: "text below",
    clearSpeech: function() {
      spokenText = "";
    },
    words: "know",
    color: "#000000",
    font: "Times New Roman",
    alignment: "center",
    size: 20
  },
  form: {
    showForm: true,
    formColor: "#a10000",
    formShape: "surrounding",
    formStyle: "fill"
  },
  keypoints: {
    showPoints: false,
    pointsColor: "#c88b9d",
    pointsStyle: "fill",
    pointSize: 5
  }
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

  canvas.width = videoWidth * sketchGuiState.canvasScale;
  canvas.height = videoHeight * sketchGuiState.canvasScale;

  livestreamCanvas.width = videoWidth * sketchGuiState.canvasScale;
  livestreamCanvas.height = videoHeight * sketchGuiState.canvasScale;
  sketchLoop();
}

export function initSketchGui(gui) {
  gui.open();
  gui.getRoot().remember(sketchGuiState);

  // Adjust canvas size
  let canvasScalar = gui
    .add(sketchGuiState, "canvasScale")
    .min(1)
    .max(5)
    .step(0.1);
  canvasScalar.onChange((newVal) => {
    canvas.width = videoWidth * newVal;
    canvas.height = videoHeight * newVal;

    livestreamCanvas.width = videoWidth * newVal;
    livestreamCanvas.height = videoHeight * newVal;
  });

  gui.add(sketchGuiState, "showVideo");

  let sideVideoController = gui.add(sketchGuiState, "showSideVideo");
  sideVideoController.onChange((newVal) => {
    if (newVal) {
      livestreamCanvas.style.display = "inline-block";
    } else {
      livestreamCanvas.style.display = "none";
    }
  });

  gui.addColor(sketchGuiState, "backgroundColor");
  gui.add(sketchGuiState, "background", ["solid color", "image - parks", "image - ocean", "image - sugimoto"]);

  let text = gui.addFolder("Text");
  gui.getRoot().remember(sketchGuiState.text);
  text.add(sketchGuiState.text, "showText");
  text.add(sketchGuiState.text, "wordOptions", ["repeat", "word by word"]);
  text.add(sketchGuiState.text, "splitOptions", ["word", "character"]);
  text.add(sketchGuiState.text, "reverseOrder");
  text.add(sketchGuiState.text, "wordSource", ["text below", "script"]);
  text.add(sketchGuiState.text, "words");
  text.add(sketchGuiState.text, "clearSpeech");
  text.addColor(sketchGuiState.text, "color");
  text.add(sketchGuiState.text, "font", [
    "Times New Roman",
    "Arial",
    "Oswald",
    "Archivo Black",
    "Playfair Display"
  ]);
  text.add(sketchGuiState.text, "alignment", ["center", "left", "right"]);
  text
    .add(sketchGuiState.text, "size")
    .min(10)
    .max(80)
    .step(1);
  text.open();

  let boundingBox = gui.addFolder("Bounding Box");
  gui.getRoot().remember(sketchGuiState.boundingBox);
  boundingBox.add(sketchGuiState.boundingBox, "showBoundingBox");
  boundingBox.add(sketchGuiState.boundingBox, "boxStyle", [
    "fill square",
    "fill circle",
    "outline",
    "ocean",
    "text",
    "image - sugimoto",
    "image - moby dick",
    "image - btj head",
  ]);
  boundingBox.addColor(sketchGuiState.boundingBox, "boxColor");
  boundingBox.add(sketchGuiState.boundingBox, "surround", [
    "full-body",
    "head"
  ]);
  boundingBox.open();

  let form = gui.addFolder("Form");
  gui.getRoot().remember(sketchGuiState.form);
  form.add(sketchGuiState.form, "showForm");
  form.addColor(sketchGuiState.form, "formColor");
  form.add(sketchGuiState.form, "formShape", ["jagged", "surrounding"]);
  form.add(sketchGuiState.form, "formStyle", ["fill", "outline"]);
  form.open();

  let keypoints = gui.addFolder("Keypoints");
  gui.getRoot().remember(sketchGuiState.keypoints);
  keypoints.add(sketchGuiState.keypoints, "showPoints");
  keypoints.addColor(sketchGuiState.keypoints, "pointsColor");
  keypoints.add(sketchGuiState.keypoints, "pointsStyle", ["fill", "outline"]);
  keypoints
    .add(sketchGuiState.keypoints, "pointSize")
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
    case "single-pose":
      minPoseConfidence = +poseDetection.guiState.singlePoseDetection
        .minPoseConfidence;
      minPartConfidence = +poseDetection.guiState.singlePoseDetection
        .minPartConfidence;
      break;
    case "multi-pose":
      minPoseConfidence = +poseDetection.guiState.multiPoseDetection
        .minPoseConfidence;
      minPartConfidence = +poseDetection.guiState.multiPoseDetection
        .minPartConfidence;
      break;
  }

  let singlePose = poses[0];
  if (singlePose) {
    let distanceScale = poseDetection.getDistance(
      singlePose.parts.leftEye.position,
      singlePose.parts.leftEar.position
    );

    ctx.save();
    ctx.scale(sketchGuiState.canvasScale, sketchGuiState.canvasScale);

    // Clear canvas with each loop
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background
    if (sketchGuiState.background == "solid color") {
      ctx.fillStyle = sketchGuiState.backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (sketchGuiState.background == "image - parks") {
      ctx.drawImage(parksImage, 0, 0, videoWidth, videoHeight);
    } else if (sketchGuiState.background == "image - sugimoto") {
      ctx.drawImage(sugimotoImage, 0, 0, videoWidth, videoHeight);
    } else if (sketchGuiState.background == "image - ocean") {
      ctx.drawImage(oceanImage, 0, 0, videoWidth, videoHeight);
    }

    // Draw the video on the canvas
    if (sketchGuiState.showVideo) {
      ctx.save();
      ctx.scale(
        -1 / sketchGuiState.canvasScale,
        1 / sketchGuiState.canvasScale
      );
      ctx.translate(-canvas.width, 0);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.restore();
    }

    let keypoints = poses[0].keypoints;
    let score = poses[0].score;

    poses.forEach(({ score, keypoints, parts }) => {
      if (score >= minPoseConfidence) {
        // if (sketchGuiState.showForm) {
        //   drawSkeleton(keypoints, minPartConfidence, ctx);
        // }
        if (sketchGuiState.boundingBox.showBoundingBox) {
          drawBoundingBox(keypoints, ctx, parts);
        }
      }
    });

    if (score >= minPoseConfidence) {
      if (sketchGuiState.form.showForm) {
        ctx.beginPath();
        ctx.moveTo(keypoints[1].position.x, keypoints[1].position.y);

        if (sketchGuiState.form.formShape == "jagged") {
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

        if (sketchGuiState.form.formStyle == "fill") {
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
    livestreamCtx.scale(
      -1 / sketchGuiState.canvasScale,
      1 / sketchGuiState.canvasScale
    );
    livestreamCtx.translate(-canvas.width, 0);
    livestreamCtx.drawImage(video, 0, 0, canvas.width, canvas.height);
    livestreamCtx.restore();
  }

  requestAnimationFrame(sketchLoop);
}

function getPerpOfLine(x1, y1, x2, y2) {
  // the two points can not be the same
  var nx = x2 - x1; // as vector
  var ny = y2 - y1;
  const len = Math.sqrt(nx * nx + ny * ny); // length of line
  nx /= len; // make one unit long
  ny /= len; // which we call normalising a vector
  return [-ny, nx]; // return the normal  rotated 90 deg
}

function toTuple({ y, x }) {
  return [y, x];
}

function shuffle(array) {
  var currentIndex = array.length,
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

  if (sketchGuiState.keypoints.pointsStyle == "fill") {
    ctx.fill();
  } else if (sketchGuiState.keypoints.pointsStyle == "outline") {
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

    const { y, x } = keypoint.position;
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
export function drawBoundingBox(keypoints, ctx, parts) {
  const boundingBox = poseDetection.getBoundingBox(keypoints);

  const boundingBoxWidth = boundingBox.maxX - boundingBox.minX;
  const boundingBoxHeight = boundingBox.maxY - boundingBox.minY;

  let minX, minY, maxX, maxY;
  if (sketchGuiState.boundingBox.surround == "full-body") {
    minX = boundingBox.minX;
    minY = boundingBox.minY;
    maxX = boundingBox.maxX;
    maxY = boundingBox.maxY;
  } else if (sketchGuiState.boundingBox.surround == "head") {
    let size = Math.abs(parts.leftEar.position.x - parts.rightEar.position.x) * 1.25;
    minX = parts.nose.position.x - size / 2;
    minY = parts.nose.position.y - size / 2;
    maxX = minX + size;
    maxY = minY + size;
  }

  if (sketchGuiState.boundingBox.boxStyle == "ocean") {
    // Top
    ctx.drawImage(
      oceanImage,
      0,
      0 - videoHeight + minY,
      videoWidth,
      videoHeight
    );

    // Bottom
    ctx.drawImage(oceanImage, 0, maxY, videoWidth, videoHeight);

    // Right side
    ctx.drawImage(oceanImage, maxX, minY, videoWidth, maxY - minY);

    // Left side
    ctx.drawImage(
      oceanImage,
      0 - videoWidth + minX,
      minY,
      videoWidth,
      maxY - minY
    );
  } else if (sketchGuiState.boundingBox.boxStyle == "fill square") {
    ctx.fillStyle = sketchGuiState.boundingBox.boxColor;
    ctx.fillRect(minX, minY, maxX - minX, maxY - minY);
  } else if (sketchGuiState.boundingBox.boxStyle == "fill circle") {
    ctx.fillStyle = sketchGuiState.boundingBox.boxColor;
    ctx.beginPath();
    let circleRad = (maxX - minX) * 0.8;
    ctx.arc(minX + circleRad/2, minY + circleRad/2, circleRad, 0, 2 * Math.PI);
    ctx.fill();
  } else if (sketchGuiState.boundingBox.boxStyle == "outline") {
    ctx.fillStyle = sketchGuiState.boundingBox.boxColor;
    ctx.strokeStyle = sketchGuiState.boundingBox.boxColor;
    ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
  } else if (sketchGuiState.boundingBox.boxStyle == "text") {
    let text = "";
    if (sketchGuiState.text.wordSource == "text below") {
      text = sketchGuiState.text.words;
    } else if (sketchGuiState.text.wordSource == "speech") {
      text = spokenText;
    } else if (sketchGuiState.text.wordSource == "script") {
      text =
        "Bobbing up and down in that sea Pip was left behind at sea " +
        "The ribs and terrors in the whale " +
        "Carried alive to wondrous depths " +
        "It is for the sea who owns the pirates, not the pirates the sea " +
        "He saw God’s foot upon the treadle of the loom " +
        "This what God feel like " +
        "The endless waters within the cosmic space " +
        "But drowned the infinite of his soul " +
        "If I could smoke fear away ";
    }
    // Top
    // wrapText(ctx, text, 0, 0 - videoHeight + minY, videoWidth, minY);
    wrapText(ctx, text, minX, 0 - videoHeight + minY, maxX - minX, minY);

    // Sides
    // wrapText(ctx, text, 0 - videoWidth + minX, minY, videoWidth, maxY - minY);
    // wrapText(ctx, text, maxX, minY, videoWidth - maxX, maxY - minY);

    wrapText(ctx, text, 0, 0, minX, videoHeight);
    wrapText(ctx, text, maxX, 0, videoWidth - maxX, videoHeight);
    // Bottom
    wrapText(ctx, text, minX, maxY, maxX - minX, videoHeight);
  } else if (sketchGuiState.boundingBox.boxStyle == "image - moby dick") {
    ctx.drawImage(mobyImage, minX, minY, maxX - minX, maxY - minY);
  } else if (sketchGuiState.boundingBox.boxStyle == "image - btj head") {
    ctx.drawImage(billImage, minX, minY, maxX - minX, maxY - minY);
  } else if (sketchGuiState.boundingBox.boxStyle == "image - sugimoto") {
    ctx.drawImage(sugimotoImage, minX, minY, maxX - minX, maxY - minY);
  }
}

function wrapText(context, text, x, y, maxWidth, maxHeight) {
  let words = text.split("");
  var line = "";
  let lineHeight = sketchGuiState.text.size;
  let n = 0;
  while (y < maxHeight) {
    var testLine = line + words[n] + " ";
    var metrics = context.measureText(testLine);
    var testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      context.font =
        sketchGuiState.text.size + "px " + sketchGuiState.text.font;
      context.fillStyle = sketchGuiState.text.color;
      context.fillText(line, x, y);
      n = (n % words.length) - 1;
      line = words[n % words.length] + " ";
      y += lineHeight;
    } else {
      line = testLine;
    }
    n = (n + 1) % words.length;
  }
}
