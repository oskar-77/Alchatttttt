import * as faceapi from 'face-api.js';
import type { EmotionData } from '@shared/schema';

let modelsLoaded = false;

export async function loadFaceApiModels(): Promise<void> {
  if (modelsLoaded) return;

  try {
    const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@latest/model';
    
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
      faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL)
    ]);

    modelsLoaded = true;
    console.log('Face-API models loaded successfully');
  } catch (error) {
    console.error('Failed to load Face-API models:', error);
    throw error;
  }
}

export async function detectFaceEmotions(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement
): Promise<{
  emotions: EmotionData;
  age?: number;
  gender?: string;
} | null> {
  if (!modelsLoaded) {
    throw new Error('Face-API models not loaded');
  }

  try {
    const detections = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceExpressions()
      .withAgeAndGender();

    // Clear canvas
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    if (detections && detections.length > 0) {
      // Use the first (most confident) detection
      const detection = detections[0];

      // Draw face detection box and landmarks
      const resizedDetections = faceapi.resizeResults([detection], {
        width: video.videoWidth,
        height: video.videoHeight
      });

      if (ctx) {
        // Draw face box
        faceapi.draw.drawDetections(canvas, resizedDetections);
        
        // Draw facial landmarks
        faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
      }

      // Extract emotion data
      const expressions = detection.expressions;
      const emotions: EmotionData = {
        happy: expressions.happy * 100,
        sad: expressions.sad * 100,
        angry: expressions.angry * 100,
        surprised: expressions.surprised * 100,
        fearful: expressions.fearful * 100,
        disgusted: expressions.disgusted * 100,
        neutral: expressions.neutral * 100
      };

      // Extract age and gender
      const age = Math.round(detection.age);
      const gender = detection.gender;

      return {
        emotions,
        age,
        gender
      };
    }

    return null;
  } catch (error) {
    console.error('Face detection error:', error);
    return null;
  }
}

export function isModelsLoaded(): boolean {
  return modelsLoaded;
}
