import { useState, useCallback } from "react";
import type { EmotionData } from "@shared/schema";

interface EmotionBuffer {
  emotions: EmotionData;
  timestamp: number;
  age?: number;
  gender?: string;
}

export function useEmotionBuffer() {
  const [emotionBuffer, setEmotionBuffer] = useState<EmotionBuffer[]>([]);

  const addEmotion = useCallback((emotions: EmotionData, age?: number, gender?: string) => {
    const newEntry: EmotionBuffer = {
      emotions,
      timestamp: Date.now(),
      age,
      gender
    };

    setEmotionBuffer(prev => {
      // Keep only last 10 emotion entries for efficiency
      const updated = [...prev, newEntry].slice(-10);
      return updated;
    });
  }, []);

  const getLatestEmotion = useCallback((): EmotionBuffer | null => {
    return emotionBuffer.length > 0 ? emotionBuffer[emotionBuffer.length - 1] : null;
  }, [emotionBuffer]);

  const getAverageEmotions = useCallback((timeWindowMs: number = 30000): EmotionData | null => {
    const now = Date.now();
    const recentEmotions = emotionBuffer.filter(entry => 
      now - entry.timestamp <= timeWindowMs
    );

    if (recentEmotions.length === 0) return null;

    // Calculate average emotions
    const avgEmotions: EmotionData = {
      happy: 0,
      sad: 0,
      angry: 0,
      surprised: 0,
      fearful: 0,
      disgusted: 0,
      neutral: 0
    };

    recentEmotions.forEach(entry => {
      Object.keys(avgEmotions).forEach(emotion => {
        avgEmotions[emotion as keyof EmotionData] += entry.emotions[emotion as keyof EmotionData];
      });
    });

    Object.keys(avgEmotions).forEach(emotion => {
      avgEmotions[emotion as keyof EmotionData] /= recentEmotions.length;
    });

    return avgEmotions;
  }, [emotionBuffer]);

  const clearBuffer = useCallback(() => {
    setEmotionBuffer([]);
  }, []);

  return {
    addEmotion,
    getLatestEmotion,
    getAverageEmotions,
    clearBuffer,
    bufferSize: emotionBuffer.length
  };
}