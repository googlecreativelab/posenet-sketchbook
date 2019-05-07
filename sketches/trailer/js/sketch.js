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
let canvas = document.getElementById("output");
let ctx = canvas.getContext("2d");

let livestreamCanvas = document.getElementById("livestream");
let livestreamCtx = livestreamCanvas.getContext("2d");

let poseDetection;
let video;
let videoWidth, videoHeight;

// let spokenText = "";

let pastSessions = [];
let pastSessionIndex = 0;
// pastSessions[pastSessionIndex] = [];

class PoseSession {
  constructor(currentSettings) {
    this.poses = [];
    this.pastPoses = [];
    this.currentPoseIndex = 0;
    this.settings = currentSettings;
    this.recording = true;
  }

  addPoses(poses) {
    this.poses.push(poses);
  }
}

let sessionPoseIndex = 0;

// Speech recognition stuff
// var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition;
// var SpeechGrammarList = SpeechGrammarList || webkitSpeechGrammarList;
// var SpeechRecognitionEvent =
//   SpeechRecognitionEvent || webkitSpeechRecognitionEvent;
// var recognition = new SpeechRecognition();
// recognition.continuous = true;
// recognition.lang = "en-US";
// recognition.interimResults = true;
// recognition.maxAlternatives = 1;
// recognition.start();

// recognition.onresult = function(event) {
//   let fullTranscript = "";
//   for (let r = 0; r < event.results.length; r++) {
//     fullTranscript += event.results[r][0].transcript;
//   }
//   spokenText = fullTranscript;
//   console.log("spoken text", spokenText);
// };

// recognition.onstart = function(event) {
//   console.log("speech recognition STARTED");
// };

// recognition.onend = function(event) {
//   console.log("speech recognition ended");
//   recognition.start();
// };

const lineWidth = 5;
const allColors = [];

let numberOfRows = 4;
let numberOfColumns = 4;

for (let c = 0; c < 17; c++) {
  allColors.push(getRandomColor());
}

let allParts = [
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
];

let sketchGuiState = {
  canvasScale: 1,
  visual: "trail",
  backgroundColor: "#ff4490",
  showVideo: false,
  showSideVideo: true,
  keypoints: {
    color: "#c8434b",
    showPoints: false,
    pointsStyle: "fill",
    pointSize: 5,
    nose: true,
    rightEye: false,
    rightEar: false,
    rightShoulder: false,
    rightElbow: false,
    rightWrist: false,
    rightHip: false,
    rightKnee: false,
    rightAnkle: false,
    leftEye: false,
    leftEar: false,
    leftShoulder: false,
    leftElbow: false,
    leftWrist: false,
    leftHip: false,
    leftKnee: false,
    leftAnkle: false
  },
  text: {
    showText: true,
    wordOptions: "repeat",
    splitOptions: "word",
    reverseOrder: false,
    words: "move",
    color: "#0030cd",
    font: "Times New Roman",
    alignment: "center",
    size: 80
  },
  trail: {
    numberOfPastPoses: 15,
    poseOffsetX: 10,
    poseOffsetY: 2
  },
  paint: {
    lifeSpan: 25
  }
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
    .add(sketchGuiState, "canvasScale")
    .min(1)
    .max(5)
    .step(0.1);
  canvasScalar.onChange((newVal) => {
    canvas.width = videoWidth * newVal;
    canvas.height = videoHeight * newVal;

    livestreamCanvas.width = videoWidth * sketchGuiState.canvasScale;
    livestreamCanvas.height = videoHeight * sketchGuiState.canvasScale;
    pastPoses = [];
  });

  let visualMode = gui.add(sketchGuiState, "visual", ["trail", "paint"]);
  visualMode.onChange((value) => {
    switch (value) {
      case "trail":
        trail.open();
        paint.close();
        break;
      case "paint":
        sketchGuiState.backgroundColor = "#000000";
        sketchGuiState.keypoints.color = "#ffffff";
        sketchGuiState.keypoints.pointSize = 25;
        sketchGuiState.text.color = "#ffffff";
        trail.close();
        paint.open();
        break;
    }
  });

  gui.addColor(sketchGuiState, "backgroundColor");

  gui.add(sketchGuiState, "showVideo");
  let sideVideoController = gui.add(sketchGuiState, "showSideVideo");
  sideVideoController.onChange((newVal) => {
    if (newVal) {
      livestreamCanvas.style.display = "inline-block";
    } else {
      livestreamCanvas.style.display = "none";
    }
  });

  let text = gui.addFolder("Text");
  text.add(sketchGuiState.text, "showText");
  text.add(sketchGuiState.text, "wordOptions", ["repeat", "word by word"]);
  text.add(sketchGuiState.text, "splitOptions", ["word", "character"]);
  text.add(sketchGuiState.text, "reverseOrder");
  text.add(sketchGuiState.text, "words");
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
    .min(1)
    .max(500)
    .step(1);

  let keypoints = gui.addFolder("Keypoints");
  keypoints.add(sketchGuiState.keypoints, "showPoints");
  keypoints.addColor(sketchGuiState.keypoints, 'color');
  keypoints.add(sketchGuiState.keypoints, "pointsStyle", ["fill", "outline"]);
  keypoints
    .add(sketchGuiState.keypoints, "pointSize")
    .min(1)
    .max(200)
    .step(1);

  allParts.forEach((part) => {
    keypoints.add(sketchGuiState.keypoints, part);
  });

  let trail = gui.addFolder("Trail");
  trail
    .add(sketchGuiState.trail, "numberOfPastPoses")
    .min(1)
    .max(50)
    .step(1);

  trail
    .add(sketchGuiState.trail, "poseOffsetX")
    .min(-100)
    .max(100)
    .step(1);

  trail
    .add(sketchGuiState.trail, "poseOffsetY")
    .min(-100)
    .max(100)
    .step(1);
  trail.open();

  let paint = gui.addFolder("Paint");
  paint
    .add(sketchGuiState.paint, "lifeSpan")
    .min(1)
    .max(200)
    .step(1);
}

let paintedWordIndex = 0;
let playPoseToggle = 0;
let currentSession = new PoseSession();
let currentPoses;
async function sketchLoop() {
  currentPoses = await poseDetection.getPoses();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Background
  ctx.fillStyle = sketchGuiState.backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  pastSessions.forEach((pastSesh) => {
    sketchFromPoseSession(pastSesh);
  });

  if (recordingLoop) {
    pastSessions[pastSessionIndex].addPoses(currentPoses);
  } else {
    // Still display live even if it's not happening
    sketchFromPoseArray(currentPoses);
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

function sketchFromPoseSession(aPoseSession) {
  let ps = aPoseSession;
  let poses = ps.poses[ps.currentPoseIndex];

  if (ps.poses.length > 0) {
    ps.currentPoseIndex = (ps.currentPoseIndex + 1) % ps.poses.length;
  }

  if (poses) {
    poses.forEach((singlePose) => {
      let pose = singlePose;
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
      if (ps.recording) {
        ctx.globalAlpha = 1.0;
      } else {
        ctx.globalAlpha = 0.5;
      }
      ctx.scale(sketchGuiState.canvasScale, sketchGuiState.canvasScale);

      let textToUse = "";
      textToUse = ps.settings.text.words;
      

      let allWords = [];
      if (ps.settings.text.splitOptions == "word") {
        allWords = textToUse.split(" ");
      } else if (ps.settings.text.splitOptions == "character") {
        allWords = textToUse.split("");
      }



      if (sketchGuiState.visual == "trail") {
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

        // For all past poses...
        let wordIndex = 0;
        if (ps.settings.text.reverseOrder) {
          wordIndex = allWords.length - 1;
        }
        for (let p = 0; p < ps.pastPoses.length; p++) {
          let pastPose = ps.pastPoses[p];
          if (pose) {
            let newColor = hexToRgb(sketchGuiState.keypoints.color);
            let alpha = (ps.pastPoses.length - p) / ps.pastPoses.length;
            let newColorString =
              "rgba(" +
              newColor.r +
              "," +
              newColor.g +
              "," +
              newColor.b +
              "," +
              alpha +
              ")";
            let score = pastPose.score;
            let keypoints = pastPose.keypoints;

            let newTextColor = hexToRgb(ps.settings.text.color);
            let newTextColorString =
              "rgba(" +
              newTextColor.r +
              "," +
              newTextColor.g +
              "," +
              newTextColor.b +
              "," +
              alpha +
              ")";

            ctx.save();
            ctx.translate(
              p * ps.settings.trail.poseOffsetX,
              p * ps.settings.trail.poseOffsetY
            );
            ctx.scale(alpha, alpha);
            if (score >= minPoseConfidence) {
              if (sketchGuiState.keypoints.showPoints) {
                drawKeypoints(
                  keypoints,
                  newColorString,
                  minPartConfidence,
                  ctx
                );
              }

              if (sketchGuiState.text.showText) {
                let textToShow;

                if (sketchGuiState.text.wordOptions == "repeat") {
                  textToShow = textToUse;
                } else if (sketchGuiState.text.wordOptions == "word by word") {
                  textToShow = allWords[wordIndex % allWords.length];

                  if (sketchGuiState.text.reverseOrder) {
                    wordIndex--;
                    if (wordIndex < 0) {
                      wordIndex = allWords.length - 1;
                    }
                  } else {
                    wordIndex++;
                  }
                }

                drawTexts(
                  textToShow,
                  ps.settings.text,
                  keypoints,
                  newTextColorString,
                  minPartConfidence,
                  ctx
                );
              }
            }
            ctx.restore();
          }
        }

        // Update poses
          ps.pastPoses.unshift(pose);
          while (ps.pastPoses.length > ps.settings.trail.numberOfPastPoses) {
            ps.pastPoses.pop();
          }
        
      } else if (sketchGuiState.visual == "paint") {
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

        for (let p = 0; p < pastPaintedPoses.length; p++) {
          pastPaintedPoses[p].display();
          if (pastPaintedPoses[p].lifeSpan <= 0) {
            pastPaintedPoses.pop();
          }
        }

        // Update poses
          let textToShow;
          if (sketchGuiState.text.wordOptions == "repeat") {
            textToShow = textToUse;
          } else if (sketchGuiState.text.wordOptions == "word by word") {
            textToShow = allWords[paintedWordIndex % allWords.length];

            if (sketchGuiState.text.reverseOrder) {
              paintedWordIndex--;
              if (paintedWordIndex < 0) {
                paintedWordIndex = allWords.length - 1;
              }
            } else {
              paintedWordIndex++;
            }
          }

          pastPoses.unshift(pose);
          let newPaintedPose = new PaintedPose(
            pose,
            minPartConfidence,
            sketchGuiState.keypoints.color,
            ps.settings,
            ctx,
            textToShow
          );
          pastPaintedPoses.unshift(newPaintedPose);
          if (pastPoses.length > numberOfRows * numberOfColumns) {
            pastPoses.pop();
          }
        
      }
      ctx.restore();
    });
  }
}

function sketchFromPoseArray(poseArray) {
  poseArray.forEach((singlePose) => {
    let pose = singlePose;
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
    ctx.scale(sketchGuiState.canvasScale, sketchGuiState.canvasScale);

    let textToUse = "";
    textToUse = sketchGuiState.text.words;
    

    let allWords = [];
    if (sketchGuiState.text.splitOptions == "word") {
      allWords = textToUse.split(" ");
    } else if (sketchGuiState.text.splitOptions == "character") {
      allWords = textToUse.split("");
    }

    if (sketchGuiState.visual == "trail") {
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

      // ALSO JUST TEST DRAW KEYPOINTS
      if (pose.score >= minPoseConfidence) {
        if (sketchGuiState.keypoints.showPoints) {
          drawKeypoints(pose.keypoints, "rgba(0, 0, 0, 0)", minPartConfidence, ctx);
        }
      }

      // For all past poses...
      let wordIndex = 0;
      if (sketchGuiState.text.reverseOrder) {
        wordIndex = allWords.length - 1;
      }
      for (let p = 0; p < pastPoses.length; p++) {
        let pastPose = pastPoses[p];
        if (pose) {
          let newColor = hexToRgb(sketchGuiState.keypoints.color);
          let alpha = (pastPoses.length - p) / pastPoses.length;
          let newColorString =
            "rgba(" +
            newColor.r +
            "," +
            newColor.g +
            "," +
            newColor.b +
            "," +
            alpha +
            ")";
          let score = pastPose.score;
          let keypoints = pastPose.keypoints;

          let newTextColor = hexToRgb(sketchGuiState.text.color);
          let newTextColorString =
            "rgba(" +
            newTextColor.r +
            "," +
            newTextColor.g +
            "," +
            newTextColor.b +
            "," +
            alpha +
            ")";

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

            if (sketchGuiState.text.showText) {
              let textToShow;

              if (sketchGuiState.text.wordOptions == "repeat") {
                textToShow = textToUse;
              } else if (sketchGuiState.text.wordOptions == "word by word") {
                textToShow = allWords[wordIndex % allWords.length];

                if (sketchGuiState.text.reverseOrder) {
                  wordIndex--;
                  if (wordIndex < 0) {
                    wordIndex = allWords.length - 1;
                  }
                } else {
                  wordIndex++;
                }
              }

              drawTexts(
                textToShow,
                sketchGuiState.text,
                keypoints,
                newTextColorString,
                minPartConfidence,
                ctx
              );
            }
          }
          ctx.restore();
        }
      }

      // Update poses
        pastPoses.unshift(pose);
        while (pastPoses.length > sketchGuiState.trail.numberOfPastPoses) {
          pastPoses.pop();
        }
    } else if (sketchGuiState.visual == "paint") {
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

      for (let p = 0; p < pastPaintedPoses.length; p++) {
        pastPaintedPoses[p].display();
        if (pastPaintedPoses[p].lifeSpan <= 0) {
          pastPaintedPoses.pop();
        }
      }

      // Update poses
        let textToShow;
        if (sketchGuiState.text.wordOptions == "repeat") {
          textToShow = textToUse;
        } else if (sketchGuiState.text.wordOptions == "word by word") {
          textToShow = allWords[paintedWordIndex % allWords.length];

          if (sketchGuiState.text.reverseOrder) {
            paintedWordIndex--;
            if (paintedWordIndex < 0) {
              paintedWordIndex = allWords.length - 1;
            }
          } else {
            paintedWordIndex++;
          }
        }

        pastPoses.unshift(pose);
        let newPaintedPose = new PaintedPose(
          pose,
          minPartConfidence,
          sketchGuiState.keypoints.color,
          sketchGuiState,
          ctx,
          textToShow
        );
        pastPaintedPoses.unshift(newPaintedPose);
        if (pastPoses.length > numberOfRows * numberOfColumns) {
          pastPoses.pop();
        }
      
    }
    ctx.restore();
  });
}

function hexToRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : null;
}

function toTuple({ y, x }) {
  return [y, x];
}

function getRandomColor() {
  var letters = "0123456789ABCDEF";
  var color = "#";
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
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

export function drawText(ctx, theText, textOptions, y, x, r, color) {
  ctx.font = textOptions.size + "px " + textOptions.font;
  ctx.fillStyle = color;
  ctx.textAlign = textOptions.alignment;
  ctx.fillText(theText, x, y);
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
export function drawSkeleton(keypoints, color, minConfidence, ctx, scale = 1) {
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
export function drawKeypoints(keypoints, color, minConfidence, ctx, scale = 1) {
  for (let i = 0; i < keypoints.length; i++) {
    const keypoint = keypoints[i];

    if (keypoint.score < minConfidence) {
      continue;
    }

    // MAYBE MAKE it so that you can choose the keypoints???
    const { y, x } = keypoint.position;

    if (sketchGuiState.keypoints[keypoint.part]) {
      drawPoint(
        ctx,
        y * scale,
        x * scale,
        sketchGuiState.keypoints.pointSize,
        color
      );
    }
  }
}

/**
 * Draw pose keypoints onto a canvas
 */
export function drawTexts(
  theText,
  textOptions,
  keypoints,
  color,
  minConfidence,
  ctx,
  scale = 1
) {
  for (let i = 0; i < keypoints.length; i++) {
    const keypoint = keypoints[i];

    if (keypoint.score < minConfidence) {
      continue;
    }

    // MAYBE MAKE it so that you can choose the keypoints???
    const { y, x } = keypoint.position;

    if (sketchGuiState.keypoints[keypoint.part]) {
      drawText(
        ctx,
        theText,
        textOptions,
        y * scale,
        x * scale,
        sketchGuiState.keypoints.pointSize,
        color
      );
    }
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
  var ah = parseInt(a.replace(/#/g, ""), 16),
    ar = ah >> 16,
    ag = (ah >> 8) & 0xff,
    ab = ah & 0xff,
    bh = parseInt(b.replace(/#/g, ""), 16),
    br = bh >> 16,
    bg = (bh >> 8) & 0xff,
    bb = bh & 0xff,
    rr = ar + amount * (br - ar),
    rg = ag + amount * (bg - ag),
    rb = ab + amount * (bb - ab);

  return (
    "#" + (((1 << 24) + (rr << 16) + (rg << 8) + rb) | 0).toString(16).slice(1)
  );
}

class PaintedPose {
  constructor(
    pose,
    minPartConfidence,
    fillColor,
    currentSettings,
    ctx,
    theText
  ) {
    this.pose = pose;
    this.score = pose.score;
    this.keypoints = pose.keypoints;
    this.color = fillColor;
    this.ctx = ctx;
    this.startingLifeSpan = currentSettings.paint.lifeSpan;
    this.lifeSpan = this.startingLifeSpan;
    this.minPartConfidence = minPartConfidence;
    this.settings = currentSettings;
    this.text = this.settings.text.words;
  }

  display() {
    this.lifeSpan--;

    let newColor = hexToRgb(this.color);
    let alpha = this.lifeSpan / this.startingLifeSpan;

    let newColorString =
      "rgba(" +
      newColor.r +
      "," +
      newColor.g +
      "," +
      newColor.b +
      "," +
      alpha +
      ")";

    let newTextColor = hexToRgb(this.settings.text.color);
    let newTextColorString =
      "rgba(" +
      newTextColor.r +
      "," +
      newTextColor.g +
      "," +
      newTextColor.b +
      "," +
      alpha +
      ")";

    // Update settings color

    if (sketchGuiState.keypoints.showPoints) {
      drawKeypoints(
        this.keypoints,
        newColorString,
        this.minPartConfidence,
        ctx
      );
    }
    if (sketchGuiState.text.showText) {
      drawTexts(
        this.text,
        this.settings.text,
        this.keypoints,
        newTextColorString,
        this.minPartConfidence,
        ctx
      );
    }
  }
}

let recordingLoop = false;
document.getElementById("start-loop").onclick = function() {
  document.getElementById("start-loop").disabled = true;
  document.getElementById("stop-loop").disabled = false;
  let currentSettings = JSON.parse(JSON.stringify(sketchGuiState));
  pastSessions[pastSessionIndex] = new PoseSession(currentSettings);
  recordingLoop = true;
};

document.getElementById("stop-loop").disabled = true;

document.getElementById("stop-loop").onclick = function() {
  document.getElementById("start-loop").disabled = false;
  document.getElementById("stop-loop").disabled = true;
  recordingLoop = false;
  pastSessions[pastSessionIndex].recording = false;
  pastSessionIndex++;
};