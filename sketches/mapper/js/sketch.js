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

// Import images
import image1 from "../assets/images/1.jpg";
import image2 from "../assets/images/2.jpg";
import image3 from "../assets/images/3.jpg";
import image4 from "../assets/images/4.jpg";
import image5 from "../assets/images/5.jpg";
import image6 from "../assets/images/6.jpg";
import image7 from "../assets/images/7.jpg";
import image8 from "../assets/images/8.jpg";

let imagePaths = [
  image1,
  image2,
  image3,
  image4,
  image5,
  image6,
  image7,
  image8
];

let imagePathNames = [
  "image1",
  "image2",
  "image3",
  "image4",
  "image5",
  "image6",
  "image7",
  "image8"
];

let images = {};
for (let i = 0; i < imagePaths.length; i++) {
  let newImage = new Image();
  newImage.src = imagePaths[i];
  images[imagePathNames[i]] = newImage;
}

// START NORMAL CODE
let canvas = document.getElementById("output");
let ctx = canvas.getContext("2d");

let livestreamCanvas = document.getElementById("livestream");
let livestreamCtx = livestreamCanvas.getContext("2d");

let poseDetection;
let video;
let videoWidth, videoHeight;

let sketchGuiState = {
  showVideo: true,
  showSideVideo: true,
  numberOfSections: 5,
  showSectionBorders: true,
  sectionBorderWidth: 10,
  sectionBorderColor: "#f08080",
  overallOpacity: 0.8,
  keypoints: {
    showPoints: true,
    controlPointLocation: "nose",
    pointsColor: "#f08080",
    pointsStyle: "outline",
    pointSize: 130
  },
  section1: {
    opacity: 0.8,
    image: "image1"
  },
  section2: {
    opacity: 0.8,
    image: "image2"
  },
  section3: {
    opacity: 0.8,
    image: "image3"
  },
  section4: {
    opacity: 0.8,
    image: "image4"
  },
  section5: {
    opacity: 0.8,
    image: "image5"
  },
  section6: {
    opacity: 0.8,
    image: "image6"
  }
};

let allSections = [];
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

  sketchLoop();
}

export function initSketchGui(gui) {
  gui.open();

  let sideVideoController = gui.add(sketchGuiState, "showSideVideo");
  sideVideoController.onChange(newVal => {
    if (newVal) {
      livestreamCanvas.style.display = "inline-block";
    } else {
      livestreamCanvas.style.display = "none";
    }
  });

  gui.add(sketchGuiState, "numberOfSections", [1, 2, 3, 4, 5, 6]);
  gui.add(sketchGuiState, "showSectionBorders");
  gui
    .add(sketchGuiState, "sectionBorderWidth")
    .min(1)
    .max(100)
    .step(1);
  gui.addColor(sketchGuiState, "sectionBorderColor");

  let overallOpacityController = gui
    .add(sketchGuiState, "overallOpacity")
    .min(0)
    .max(1)
    .step(0.1);

  overallOpacityController.onChange(newVal => {
    // Change opacity of all sections
    allSections.forEach(sect => {
      sect.opacity = newVal;
    });
  });

  // Affecting control point
  let keypoints = gui.addFolder("Keypoints");
  keypoints.add(sketchGuiState.keypoints, "showPoints");
  keypoints.add(sketchGuiState.keypoints, "controlPointLocation", [
    "nose",
    "rightEye",
    "rightEar",
    "rightShoulder",
    "rightElbow",
    "rightWrist",
    "rightHip",
    "rightKnee",
    "rightAnkle",
    "leftEye",
    "leftEar",
    "leftShoulder",
    "leftElbow",
    "leftWrist",
    "leftHip",
    "leftKnee",
    "leftAnkle"
  ]);
  keypoints.addColor(sketchGuiState.keypoints, "pointsColor");
  keypoints.add(sketchGuiState.keypoints, "pointsStyle", ["fill", "outline"]);
  keypoints
    .add(sketchGuiState.keypoints, "pointSize")
    .min(1)
    .max(200)
    .step(1);

  let section1 = gui.addFolder("Section 1");
  createSectionFolder(section1, sketchGuiState.section1);

  let section2 = gui.addFolder("Section 2");
  createSectionFolder(section2, sketchGuiState.section2);

  let section3 = gui.addFolder("Section 3");
  createSectionFolder(section3, sketchGuiState.section3);

  let section4 = gui.addFolder("Section 4");
  createSectionFolder(section4, sketchGuiState.section4);

  let section5 = gui.addFolder("Section 5");
  createSectionFolder(section5, sketchGuiState.section5);

  let section6 = gui.addFolder("Section 6");
  createSectionFolder(section6, sketchGuiState.section6);

  let allSections = [
    sketchGuiState.section1,
    sketchGuiState.section2,
    sketchGuiState.section3,
    sketchGuiState.section4,
    sketchGuiState.section5,
    sketchGuiState.section6
  ];
}

function createSectionFolder(sectionFolder, guiSection) {
  sectionFolder.add(guiSection, "image", imagePathNames);
  sectionFolder
    .add(guiSection, "opacity")
    .min(0)
    .max(1)
    .step(0.1);

  allSections.push(guiSection);
}

let poses;
let newCanvas = document.createElement("canvas");

async function sketchLoop() {
  poses = await poseDetection.getPoses();
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

  ctx.save();
  // Clear canvas with each loop
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (poses[0]) {
    let parts = poses[0].parts;
    let controlPoint = parts[sketchGuiState.keypoints.controlPointLocation];
    let controlPointY = controlPoint.position.y;
    let controlPointX = controlPoint.position.x;

    // Calculate the current occupied section
    let sectionWidth = videoWidth / sketchGuiState.numberOfSections;
    let currentSection;
    let currentSectionLeftX;
    let currentSectionIndex = 0;
    let blendSectionIndex = 1;
    let blendPercentage = 0;

    for (let s = 1; s <= sketchGuiState.numberOfSections; s++) {
      if (controlPointX < sectionWidth * s) {
        currentSectionIndex = s - 1;
        currentSection = allSections[currentSectionIndex];
        currentSectionLeftX = sectionWidth * currentSectionIndex;

        if (controlPointX < sectionWidth * (s - 1) + sectionWidth / 2) {
          // If it's less than half, blend with prev section
          blendSectionIndex = currentSectionIndex - 1;

          //
          let halfMark = currentSectionLeftX - sectionWidth / 2;
          blendPercentage = (controlPointX - halfMark) / sectionWidth;
          blendPercentage = (controlPointX - halfMark) / sectionWidth;
        } else {
          // Greater than half... working
          blendSectionIndex = currentSectionIndex + 1;

          let halfMark = currentSectionLeftX + sectionWidth / 2;
          blendPercentage = (controlPointX - halfMark) / sectionWidth;
          blendPercentage = 1 - (controlPointX - halfMark) / sectionWidth;
        }

        if (
          blendSectionIndex < 0 ||
          blendSectionIndex > sketchGuiState.numberOfSections - 1
        ) {
          blendSectionIndex = currentSectionIndex;
        }
        break;
      }
    }

    // Draw the video on the canvas
    if (sketchGuiState.showVideo) {
      ctx.save();
      ctx.scale(-1, 1);
      ctx.translate(-canvas.width, 0);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.restore();
    }
    if (currentSection && parts && controlPoint.score > 0.5) {
      ctx.globalAlpha = currentSection.opacity;
      if (images[currentSection.image]) {
        ctx.drawImage(
          images[currentSection.image],
          0,
          0,
          videoWidth,
          videoHeight
        );
      }

      if (sketchGuiState.showSectionBorders) {
        for (let s = 1; s <= sketchGuiState.numberOfSections - 1; s++) {
          ctx.strokeStyle = sketchGuiState.sectionBorderColor;
          ctx.lineWidth = sketchGuiState.sectionBorderWidth;
          ctx.strokeRect(-100, -100, sectionWidth * s + 100, canvas.height * 2);
        }
      }

      if (sketchGuiState.keypoints.showPoints) {
        drawPoint(
          ctx,
          controlPointY,
          controlPointX,
          sketchGuiState.keypoints.pointSize,
          sketchGuiState.keypoints.pointsColor
        );
      }
    }
    ctx.restore();
  } else {
    ctx.save();
    ctx.scale(-1, 1);
    ctx.translate(-canvas.width, 0);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
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

export function drawPoint(ctx, y, x, r, color) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;

  if (sketchGuiState.keypoints.pointsStyle == "fill") {
    ctx.fill();
  } else if (sketchGuiState.keypoints.pointsStyle == "outline") {
    ctx.stroke();
  }
}
