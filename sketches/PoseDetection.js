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

/**
 * Handle pose estimation with PoseNet.
 */
import * as posenet from "@tensorflow-models/posenet";

export default class PoseDetection {
  constructor(video, mobile) {
    this.video = video;
    this.guiState;
    this.isMobile = mobile;
    this.algorithm = "single"; // "single" or "multi"
    this.flipHorizontal = true; // Flip on the horizontal plane because using front facing webcam
    this.smoothFactor = 0.75; // Amount of basic smoothing, between 0 - 1
    this.smoothPrevPose;
    this.smoothPrevPoses = [];
  }

  async initPoseDetection() {
    this.net = await posenet.load(0.75);
  }

  initGui(gui) {
    this.guiState = {
      algorithm: "single-pose",
      smoothing: this.smoothFactor,
      input: {
        mobileNetArchitecture: this.isMobile ? "0.50" : "0.75",
        outputStride: 16,
        imageScaleFactor: 0.5
      },
      singlePoseDetection: {
        minPoseConfidence: 0.25,
        minPartConfidence: 0.5
      },
      multiPoseDetection: {
        maxPoseDetections: 5,
        minPoseConfidence: 0.15,
        minPartConfidence: 0.1,
        nmsRadius: 30.0
      }
    };

    // The single-pose algorithm is faster and simpler but requires only one
    // person to be in the frame or results will be innaccurate. Multi-pose works
    // for more than 1 person
    const algorithmController = gui.add(this.guiState, "algorithm", [
      "single-pose",
      "multi-pose"
    ]).listen();

    const smoothingController = gui
      .add(this.guiState, "smoothing")
      .min(0.0)
      .max(1.0);

    // The input parameters have the most effect on accuracy and speed of the
    // network
    let input = gui.addFolder("Input");

    // Architecture: there are a few PoseNet models varying in size and
    // accuracy. 1.01 is the largest, but will be the slowest. 0.50 is the
    // fastest, but least accurate.
    const architectureController = input.add(
      this.guiState.input,
      "mobileNetArchitecture",
      ["1.01", "1.00", "0.75", "0.50"]
    );
    // Output stride:  Internally, this parameter affects the height and width of
    // the layers in the neural network. The lower the value of the output stride
    // the higher the accuracy but slower the speed, the higher the value the
    // faster the speed but lower the accuracy.
    input.add(this.guiState.input, "outputStride", [8, 16, 32]);
    // Image scale factor: What to scale the image by before feeding it through
    // the network.
    input
      .add(this.guiState.input, "imageScaleFactor")
      .min(0.2)
      .max(1.0);
    input.close();

    // Pose confidence: the overall confidence in the estimation of a person's
    // pose (i.e. a person detected in a frame)
    // Min part confidence: the confidence that a particular estimated keypoint
    // position is accurate (i.e. the elbow's position)
    let single = gui.addFolder("Single Pose Detection");
    single.add(
      this.guiState.singlePoseDetection,
      "minPoseConfidence",
      0.0,
      1.0
    );
    single.add(
      this.guiState.singlePoseDetection,
      "minPartConfidence",
      0.0,
      1.0
    );

    let multi = gui.addFolder("Multi Pose Detection");
    multi
      .add(this.guiState.multiPoseDetection, "maxPoseDetections")
      .min(1)
      .max(20)
      .step(1);
    multi.add(this.guiState.multiPoseDetection, "minPoseConfidence", 0.0, 1.0);
    multi.add(this.guiState.multiPoseDetection, "minPartConfidence", 0.0, 1.0);
    // nms Radius: controls the minimum distance between poses that are returned
    // defaults to 20, which is probably fine for most use cases
    multi
      .add(this.guiState.multiPoseDetection, "nmsRadius")
      .min(0.0)
      .max(40.0);
    multi.close();

    architectureController.onChange((architecture) => {
      this.guiState.changeToArchitecture = architecture;
    });

    algorithmController.onChange((value) => {
      switch (value) {
        case "single-pose":
          multi.close();
          single.open();
          this.algorithm = "single";
          break;
        case "multi-pose":
          single.close();
          multi.open();
          this.algorithm = "multi";
          break;
      }
    });

    smoothingController.onChange((value) => {
      this.smoothFactor = value;
    });
  }

  useMultiPose() {
    this.guiState.algorithm = "multi-pose";
    this.algorithm = "multi";
  }

  useSinglePose() {
    this.guiState.algorithm = "single-pose";
    this.algorithm = "single";
  }

  async getPoses() {
    if (this.guiState.changeToArchitecture) {
      // Important to purge variables and free up GPU memory
      this.net.dispose();

      // Load the PoseNet model weights for either the 0.50, 0.75, 1.00, or 1.01
      // version
      // PoseNet model as argument
      this.net = await posenet.load(+this.guiState.changeToArchitecture);

      this.guiState.changeToArchitecture = null;
    }

    // Scale an image down to a certain factor. Too large of an image will slow
    // down the GPU
    const imageScaleFactor = this.guiState.input.imageScaleFactor;
    const outputStride = +this.guiState.input.outputStride;

    let poses = [];
    switch (this.algorithm) {
      case "single":
        const pose = await this.net.estimateSinglePose(
          this.video,
          imageScaleFactor,
          this.flipHorizontal,
          outputStride
        );
        poses.push(pose);
        break;
      case "multi":
        poses = await this.net.estimateMultiplePoses(
          this.video,
          imageScaleFactor,
          this.flipHorizontal,
          outputStride,
          this.guiState.multiPoseDetection.maxPoseDetections,
          this.guiState.multiPoseDetection.minPartConfidence,
          this.guiState.multiPoseDetection.nmsRadius
        );
        break;
    }

    let newPoses = [];
    for (let p = 0; p < poses.length; p++) {
      let pose = poses[p];
      pose = this.smoothPose(this.smoothFactor, pose, p);

      // Add parts mapping
      pose.parts = [];
      pose.keypoints.forEach((point) => {
        pose.parts[point.part] = point;
      });

      if (pose.score > this.guiState.multiPoseDetection.minPoseConfidence) {
        newPoses.push(pose);
      }
    }
    return newPoses;
  }

  getAdjacentKeyPoints(keypoints, minConfidence) {
    return posenet.getAdjacentKeyPoints(keypoints, minConfidence);
  }

  getBoundingBox(keypoints) {
    return posenet.getBoundingBox(keypoints);
  }

  getDistance(a, b) {
    const distX = a.x - b.x;
    const distY = a.y - b.y;
    return Math.sqrt(distX ** 2 + distY ** 2);
  }

  getKeypoint(pose, part) {
    return pose.keypoints.filter((keypoint) => keypoint.part === part)[0];
  }

  getKeypoints(pose, parts) {
    const keypoints = {};
    if (parts) {
      parts.forEach((part) => {
        keypoints[part] = this.getKeypoint(pose, part);
      });
    } else {
      pose.keypoints.forEach((keypoint) => {
        keypoints[keypoint.part] = this.getKeypoint(pose, keypoint.part);
      });
    }
    return keypoints;
  }

  smoothPose(smoothFactor, pose, p) {
    if (!this.smoothPrevPoses[p]) {
      this.smoothPrevPoses[p] = pose;
      return pose;
    }
    let smoothPrevPose = this.smoothPrevPoses[p];

    const keypoints = pose.keypoints;
    const prevKeypoints = smoothPrevPose.keypoints;
    const smoothKeypoints = keypoints;

    for (let p = 0; p < keypoints.length; p++) {
      const pos = keypoints[p].position;
      const prevPos = prevKeypoints[p].position;
      const smoothPos = smoothKeypoints[p].position;

      smoothPos.x = (prevPos.x - pos.x) * smoothFactor + pos.x;
      smoothPos.y = (prevPos.y - pos.y) * smoothFactor + pos.y;
    }

    let smoothPose = {};
    smoothPose.keypoints = smoothKeypoints;
    smoothPose.score = pose.score;
    this.smoothPrevPoses[p] = smoothPose;
    return smoothPose;
  }
}
