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

import {Howl, Howler} from 'howler';
import BrianEno from '/assets/audio/BrianEno.mp3';

// SOUNDS
let soundPaths = [
  BrianEno,
];

let soundPathNames = [
  'BrianEno',
];
let sounds = {};
for (let i = 0; i < soundPaths.length; i++) {
  let sound = new Howl({
    src: [soundPaths[i]],
    loop: true,
  });
  sounds[soundPathNames[i]] = sound;
}

// Images
// Parks x Eggleston
import parkseggleston1 from '/assets/parkseggleston/parkseggleston01.png';
import parkseggleston2 from '/assets/parkseggleston/parkseggleston02.png';
import parkseggleston3 from '/assets/parkseggleston/parkseggleston03.png';
import parkseggleston4 from '/assets/parkseggleston/parkseggleston04.png';
import parkseggleston5 from '/assets/parkseggleston/parkseggleston05.png';
import parkseggleston6 from '/assets/parkseggleston/parkseggleston06.png';

let imagePaths = [
  parkseggleston1,
  parkseggleston2,
  parkseggleston3,
  parkseggleston4,
  parkseggleston5,
  parkseggleston6
];

let imagePathNames = [
  'parkseggleston1',
  'parkseggleston2',
  'parkseggleston3',
  'parkseggleston4',
  'parkseggleston5',
  'parkseggleston6'
];

let images = {};
for (let i = 0; i < imagePaths.length; i++) {
  let newImage = new Image();
  newImage.src = imagePaths[i];
  images[imagePathNames[i]] = newImage;
  console.log(images);

}

// START NORMAL CODE
let canvas = document.getElementById('output');
let ctx = canvas.getContext('2d');

let livestreamCanvas = document.getElementById('livestream');
let livestreamCtx = livestreamCanvas.getContext('2d');

let poseDetection;
let video;
let videoWidth, videoHeight;

const color = 'aqua';
const lineWidth = 2;

let sectionObject = {
  showVideo: true,
  opacity: 0.8,
  system: 'gradient',
  image: 'rothko1',
  leftColor: '#000000',
  rightColor: '#ffffff',
  defaultYPosition: 300,
  currentAsDefault: function() {
    let parts = poses[0].parts;
    let controlPoint = parts[sketchGuiState.keypoints.controlPointLocation];
    sketchGuiState.section1.defaultYPosition = controlPoint.position.y;
  },
};

let sketchGuiState = {
  canvasScale: 1,
  showSideVideo: true,
  numberOfSections: 1,
  showSectionBorders: true,
  sectionBorderWidth: 10,
  sectionBorderColor: '#000000',
  overallOpacity: 0.8,
  soundEffect: 'rate',
  keypoints: {
    showPoints: true,
    controlPointLocation: 'nose',
    pointsColor: '#000000',
    pointsStyle: 'fill',
    pointSize: 5,
  },
  section1: {
    showVideo: true,
    rightBorderPosition: 750,
    opacity: 0.8,
    system: 'image',
    image: 'parkseggleston1',
    sound: 'BrianEno',
    leftColor: '#000000',
    rightColor: '#ffffff',
    defaultYPosition: 300,
    currentAsDefault: function() {
      let parts = poses[0].parts;
      let controlPoint = parts[sketchGuiState.keypoints.controlPointLocation];
      sketchGuiState.section1.defaultYPosition = controlPoint.position.y;
    },
  },
  section2: {
    showVideo: true,
    rightBorderPosition: 750,
    opacity: 0.8,
    system: 'image',
    image: 'parkseggleston2',
    sound: 'BrianEno',
    leftColor: '#000000',
    rightColor: '#ffffff',
    defaultYPosition: 300,
    currentAsDefault: function() {
      let parts = poses[0].parts;
      let controlPoint = parts[sketchGuiState.keypoints.controlPointLocation];
      sketchGuiState.section2.defaultYPosition = controlPoint.position.y;
    },
  },
  section3: {
    showVideo: true,
    rightBorderPosition: 750,
    opacity: 0.8,
    system: 'image',
    sound: 'BrianEno',
    image: 'parkseggleston3',
    leftColor: '#000000',
    rightColor: '#ffffff',
    defaultYPosition: 300,
    currentAsDefault: function() {
      let parts = poses[0].parts;
      let controlPoint = parts[sketchGuiState.keypoints.controlPointLocation];
      sketchGuiState.section3.defaultYPosition = controlPoint.position.y;
    },
  },
  section4: {
    showVideo: true,
    rightBorderPosition: 750,
    opacity: 0.8,
    system: 'image',
    sound: 'BrianEno',
    image: 'parkseggleston4',
    leftColor: '#000000',
    rightColor: '#ffffff',
    defaultYPosition: 300,
    currentAsDefault: function() {
      let parts = poses[0].parts;
      let controlPoint = parts[sketchGuiState.keypoints.controlPointLocation];
      sketchGuiState.section4.defaultYPosition = controlPoint.position.y;
    },
  },
  section5: {
    showVideo: true,
    rightBorderPosition: 750,
    opacity: 0.8,
    system: 'image',
    sound: 'BrianEno',
    image: 'parkseggleston5',
    leftColor: '#000000',
    rightColor: '#ffffff',
    defaultYPosition: 300,
    currentAsDefault: function() {
      let parts = poses[0].parts;
      let controlPoint = parts[sketchGuiState.keypoints.controlPointLocation];
      sketchGuiState.section5.defaultYPosition = controlPoint.position.y;
    },
  },
  section6: {
    showVideo: true,
    rightBorderPosition: 750,
    opacity: 0.8,
    system: 'image',
    sound: 'BrianEno',
    image: 'parkseggleston6',
    leftColor: '#000000',
    rightColor: '#ffffff',
    defaultYPosition: 300,
    currentAsDefault: function() {
      let parts = poses[0].parts;
      let controlPoint = parts[sketchGuiState.keypoints.controlPointLocation];
      sketchGuiState.section6.defaultYPosition = controlPoint.position.y;
    },
  },
};

let allSections = [];
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
    const audio = new Audio(audioUrl);
    // audio.play();
    console.log('audio URL', audioUrl);
    console.log('audio', audio);

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
  });
};

navigator.mediaDevices
  .getUserMedia({audio: true, video: false})
  .then(handleSuccess);

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

  canvas.width = videoWidth * sketchGuiState.canvasScale;
  canvas.height = videoHeight * sketchGuiState.canvasScale;

  livestreamCanvas.width = videoWidth * sketchGuiState.canvasScale;
  livestreamCanvas.height = videoHeight * sketchGuiState.canvasScale;

  sketchLoop();
}

export function initSketchGui(gui) {
  gui.open();

  // Adjust canvas size
  let canvasScalar = gui
    .add(sketchGuiState, 'canvasScale')
    .min(1)
    .max(5)
    .step(0.1);
  canvasScalar.onChange((newVal) => {
    canvas.width = videoWidth * newVal;
    canvas.height = videoHeight * newVal;

    livestreamCanvas.width = videoWidth * newVal;
    livestreamCanvas.height = videoHeight * newVal;
  });

  let sideVideoController = gui.add(sketchGuiState, 'showSideVideo');
  sideVideoController.onChange((newVal) => {
    if (newVal) {
      livestreamCanvas.style.display = 'inline-block';
    } else {
      livestreamCanvas.style.display = 'none';
    }
  });

  gui.add(sketchGuiState, 'soundEffect', ['rate', 'volume']);

  let sectionController = gui.add(sketchGuiState, 'numberOfSections', [
    1,
    2,
    3,
    4,
    5,
    6,
  ]);
  gui.add(sketchGuiState, 'showSectionBorders');
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
  keypoints.getRoot().remember(sketchGuiState.keypoints);
  keypoints.add(sketchGuiState.keypoints, 'showPoints');
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
  gui.getRoot().remember(sketchGuiState.section1);

  let section2 = gui.addFolder('Section 2');
  createSectionFolder(section2, sketchGuiState.section2);
  gui.getRoot().remember(sketchGuiState.section2);

  let section3 = gui.addFolder('Section 3');
  createSectionFolder(section3, sketchGuiState.section3);
  gui.getRoot().remember(sketchGuiState.section3);

  let section4 = gui.addFolder('Section 4');
  createSectionFolder(section4, sketchGuiState.section4);
  gui.getRoot().remember(sketchGuiState.section4);

  let section5 = gui.addFolder('Section 5');
  createSectionFolder(section5, sketchGuiState.section5);
  gui.getRoot().remember(sketchGuiState.section5);

  let section6 = gui.addFolder('Section 6');
  createSectionFolder(section6, sketchGuiState.section6);
  gui.getRoot().remember(sketchGuiState.section6);

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
  sectionFolder.add(guiSection, 'system', ['gradient', 'image']);
  sectionFolder.add(guiSection, 'image', imagePathNames);
  sectionFolder.add(guiSection, 'sound', soundPathNames);
  sectionFolder.add(guiSection, 'showVideo');
  sectionFolder
    .add(guiSection, 'rightBorderPosition')
    .min(0)
    .max(canvas.width)
    .step(1)
    .listen();

  sectionFolder
    .add(guiSection, 'opacity')
    .min(0)
    .max(1)
    .step(0.1);

  sectionFolder.addColor(guiSection, 'leftColor');
  sectionFolder.addColor(guiSection, 'rightColor');

  sectionFolder
    .add(guiSection, 'defaultYPosition')
    .min(0)
    .max(canvas.height)
    .step(1)
    .listen();

  sectionFolder
    .add(guiSection, 'defaultYPosition')
    .min(0)
    .max(canvas.height)
    .step(1)
    .listen();
  sectionFolder.add(guiSection, 'currentAsDefault');

  allSections.push(guiSection);

  // Save settings
  sectionFolder.getRoot().remember(guiSection);
}

let poses;
async function sketchLoop() {
  // TO DO: get rid of await asynchronous deal outside of posenet

  console.log('in sketch loop');
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

  if (poses[0]) {
    let parts = poses[0].parts;
    let controlPoint = parts[sketchGuiState.keypoints.controlPointLocation];
    let controlPointY = controlPoint.position.y;
    let controlPointX = controlPoint.position.x;

    // Calculate the current occupied section
    let sectionWidth = videoWidth / sketchGuiState.numberOfSections;
    let currentSection;
    let currentSectionLeftX, currentSectionRightX;
    let currentSectionIndex = 0;
    let blendSectionIndex = 1;
    let blendPercentage = 0;

    for (let s = 1; s <= sketchGuiState.numberOfSections; s++) {
      console.log('seemingly doing some crazy shit');
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

    if (currentSection) {
      // Draw the video on the canvas
      if (currentSection.showVideo) {
        console.log('showing video');

        ctx.save();
        ctx.scale(
          -1 / sketchGuiState.canvasScale,
          1 / sketchGuiState.canvasScale
        );
        ctx.translate(-canvas.width, 0);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        ctx.restore();
      }

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
        if (currentSection.system == 'gradient') {
          ctx.fillStyle = newColorString;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else if (currentSection.system == 'image') {
          console.log('image selected');
          ctx.globalAlpha = currentSection.opacity;
          let pixels = 4 * videoWidth * videoHeight;
          console.log('image: ', currentSection.image);
          console.log(images['parkseggleston1']);
          console.log(images);

          if (images[currentSection.image]) {
            ctx.drawImage(
              images[currentSection.image],
              0,
              0,
              videoWidth,
              videoHeight
            );
            let image1 = ctx.getImageData(0, 0, videoWidth, videoHeight);
            let imageData1 = image1.data;
            ctx.drawImage(
              images[allSections[blendSectionIndex].image],
              0,
              0,
              videoWidth,
              videoHeight
            );
            let image2 = ctx.getImageData(0, 0, videoWidth, videoHeight);
            let imageData2 = image2.data;
            while (pixels--) {
              imageData1[pixels] =
                imageData1[pixels] * blendPercentage +
                imageData2[pixels] * (1 - blendPercentage);
            }
            let newCanvas = document.createElement('canvas');
            newCanvas.width = image1.width;
            newCanvas.height = image1.height;

            newCanvas
              .getContext('2d')
              .putImageData(image1, 0, 0, 0, 0, videoWidth, videoHeight);

            // Draw blended image
            console.log('trying to draw image');
            ctx.drawImage(newCanvas, 0, 0, videoWidth, videoHeight);
            ctx.globalAlpha = 1;
          }
        }

        if (sketchGuiState.showSectionBorders) {
          for (let s = 1; s <= sketchGuiState.numberOfSections - 1; s++) {
            ctx.strokeStyle = sketchGuiState.sectionBorderColor;
            ctx.lineWidth = sketchGuiState.sectionBorderWidth;
            ctx.strokeRect(
              -100,
              -100,
              sectionWidth * s + 100,
              canvas.height * 2
            );
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
      } else {
        ctx.save();
        ctx.scale(
          -1 / sketchGuiState.canvasScale,
          1 / sketchGuiState.canvasScale
        );
        ctx.translate(-canvas.width, 0);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        ctx.restore();
      }
    }
    ctx.restore();
  } else {
    ctx.save();
    ctx.scale(-1 / sketchGuiState.canvasScale, 1 / sketchGuiState.canvasScale);
    ctx.translate(-canvas.width, 0);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
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

  console.log('end of loop');
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
