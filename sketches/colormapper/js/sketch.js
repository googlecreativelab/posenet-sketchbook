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

// Images
// Parks x Eggleston
// import parkseggleston1 from '/assets/parkseggleston/parkseggleston01.png';
// import parkseggleston2 from '/assets/parkseggleston/parkseggleston02.png';
// import parkseggleston3 from '/assets/parkseggleston/parkseggleston03.png';
// import parkseggleston4 from '/assets/parkseggleston/parkseggleston04.png';
// import parkseggleston5 from '/assets/parkseggleston/parkseggleston05.png';
// import parkseggleston6 from '/assets/parkseggleston/parkseggleston06.png';

// let imagePaths = [
//   parkseggleston1,
//   parkseggleston2,
//   parkseggleston3,
//   parkseggleston4,
//   parkseggleston5,
//   parkseggleston6,
// ];

// let imagePathNames = [
//   'parkseggleston1',
//   'parkseggleston2',
//   'parkseggleston3',
//   'parkseggleston4',
//   'parkseggleston5',
//   'parkseggleston6',
// ];

// let images = {};
// for (let i = 0; i < imagePaths.length; i++) {
//   let newImage = new Image();
//   newImage.src = imagePaths[i];
//   images[imagePathNames[i]] = newImage;
// }

let canvas = document.getElementById('output');
let ctx = canvas.getContext('2d');

let livestreamCanvas = document.getElementById('livestream');
let livestreamCtx = livestreamCanvas.getContext('2d');

let poseDetection;
let video;
let videoWidth, videoHeight;

let sketchGuiState = {
  showVideo: true,
  showSideVideo: true,
  numberOfSections: 5,
  showSectionBorders: true,
  sectionBorderWidth: 10,
  sectionBorderColor: '#f08080',
  overallOpacity: 0.8,
  keypoints: {
    showPoint: true,
    controlPointLocation: 'nose',
    pointsColor: '#e1e1e1',
    pointsStyle: 'fill',
    pointSize: 5,
  },
  section1: {
    opacity: 0.8,
    leftColor: '#00c1ff',
    rightColor: '#00c1ff',
  },
  section2: {
    opacity: 0.8,
    leftColor: '#00c1ff',
    rightColor: '#ff00d1',
  },
  section3: {
    opacity: 0.8,
    leftColor: '#ff00d1',
    rightColor: '#ff00d1',
  },
  section4: {
    opacity: 0.8,
    leftColor: '#ff00d1',
    rightColor: '#6cff2f',
  },
  section5: {
    opacity: 0.8,
    leftColor: '#6cff2f',
    rightColor: '#6cff2f',
  },
  section6: {
    opacity: 0.8,
    leftColor: '#c4acff',
    rightColor: '#c4acff',
  },
};

let allSections = [];

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

  let sideVideoController = gui.add(sketchGuiState, 'showSideVideo');
  sideVideoController.onChange((newVal) => {
    if (newVal) {
      livestreamCanvas.style.display = 'inline-block';
    } else {
      livestreamCanvas.style.display = 'none';
    }
  });
  gui.add(sketchGuiState, 'showSectionBorders');

  let sectionController = gui.add(sketchGuiState, 'numberOfSections', [
    1,
    2,
    3,
    4,
    5,
    6,
  ]);
  gui
    .add(sketchGuiState, 'sectionBorderWidth')
    .min(1)
    .max(100)
    .step(1);
  gui.addColor(sketchGuiState, 'sectionBorderColor');

  let overallOpacityController = gui
    .add(sketchGuiState, 'overallOpacity')
    .min(0)
    .max(1)
    .step(0.1);

  overallOpacityController.onChange((newVal) => {
    // Change opacity of all sections
    allSections.forEach((sect) => {
      sect.opacity = newVal;
    });
  });

  // Affecting control point
  let keypoints = gui.addFolder('Keypoints');
  keypoints.add(sketchGuiState.keypoints, 'showPoint');
  keypoints.add(sketchGuiState.keypoints, 'controlPointLocation', [
    'nose',
    'rightEye',
    'rightEar',
    'rightShoulder',
    'rightElbow',
    'rightWrist',
    'rightHip',
    'rightKnee',
    'rightAnkle',
    'leftEye',
    'leftEar',
    'leftShoulder',
    'leftElbow',
    'leftWrist',
    'leftHip',
    'leftKnee',
    'leftAnkle',
  ]);
  keypoints.addColor(sketchGuiState.keypoints, 'pointsColor');
  keypoints.add(sketchGuiState.keypoints, 'pointsStyle', ['fill', 'outline']);
  keypoints
    .add(sketchGuiState.keypoints, 'pointSize')
    .min(1)
    .max(200)
    .step(1);

  let section1 = gui.addFolder('Section 1');
  createSectionFolder(section1, sketchGuiState.section1);

  let section2 = gui.addFolder('Section 2');
  createSectionFolder(section2, sketchGuiState.section2);

  let section3 = gui.addFolder('Section 3');
  createSectionFolder(section3, sketchGuiState.section3);

  let section4 = gui.addFolder('Section 4');
  createSectionFolder(section4, sketchGuiState.section4);

  let section5 = gui.addFolder('Section 5');
  createSectionFolder(section5, sketchGuiState.section5);

  let section6 = gui.addFolder('Section 6');
  createSectionFolder(section6, sketchGuiState.section6);

  let allSections = [
    sketchGuiState.section1,
    sketchGuiState.section2,
    sketchGuiState.section3,
    sketchGuiState.section4,
    sketchGuiState.section5,
    sketchGuiState.section6,
  ];
}

function createSectionFolder(sectionFolder, guiSection) {
  sectionFolder.addColor(guiSection, 'leftColor');
  sectionFolder.addColor(guiSection, 'rightColor');
  allSections.push(guiSection);
}

let poses;
async function sketchLoop() {
  // TO DO: get rid of await asynchronous deal outside of posenet

  poses = await poseDetection.getPoses();

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
  let sectionWidth = videoWidth / sketchGuiState.numberOfSections;

  if (poses[0]) {
    let parts = poses[0].parts;
    let controlPoint = parts[sketchGuiState.keypoints.controlPointLocation];
    let controlPointY = controlPoint.position.y;
    let controlPointX = controlPoint.position.x;

    // Calculate the current occupied section
    let currentSection;
    let currentSectionLeftX;
    let currentSectionIndex = 0;

    for (let s = 1; s <= sketchGuiState.numberOfSections; s++) {
      if (controlPointX < sectionWidth * s) {
        currentSectionIndex = s - 1;
        currentSection = allSections[currentSectionIndex];
        currentSectionLeftX = sectionWidth * currentSectionIndex;
        break;
      }
    }

    if (currentSection) {
      if (parts && controlPoint.score > 0.5) {
        let newHexString = lerpColor(
          currentSection.leftColor,
          currentSection.rightColor,
          (controlPointX - currentSectionLeftX) / sectionWidth
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
            currentSection.opacity +
            ')';
        } else {
          newColorString = currentSection.rightColor;
        }

        // Rectangle Overlay
        ctx.fillStyle = newColorString;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (sketchGuiState.keypoints.showPoint) {
          drawPoint(
            ctx,
            controlPointY,
            controlPointX,
            sketchGuiState.keypoints.pointSize,
            sketchGuiState.keypoints.pointsColor
          );
        }
      } else {
        ctx.save();
        ctx.scale(-1, 1);
        ctx.translate(-canvas.width, 0);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        ctx.restore();
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

  if (sketchGuiState.showSectionBorders) {
    for (let s = 1; s <= sketchGuiState.numberOfSections - 1; s++) {
      ctx.strokeStyle = sketchGuiState.sectionBorderColor;
      ctx.lineWidth = sketchGuiState.sectionBorderWidth;
      ctx.strokeRect(-100, -100, sectionWidth * s + 100, canvas.height * 2);
    }
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
