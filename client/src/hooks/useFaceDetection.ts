import { useState, useEffect, useRef } from "react";
import { loadFaceApiModels, detectFaceEmotions } from "@/lib/faceApi";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { EmotionData } from "@shared/schema";

interface UseFaceDetectionProps {
  videoElement: HTMLVideoElement | null;
  canvasElement: HTMLCanvasElement | null;
  onDetection: (emotions: EmotionData, age?: number, gender?: string) => void;
}

export function useFaceDetection({ 
  videoElement, 
  canvasElement, 
  onDetection 
}: UseFaceDetectionProps) {
  const [isModelsLoaded, setIsModelsLoaded] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastDetectionRef = useRef<{
    emotions: EmotionData;
    age?: number;
    gender?: string;
    sessionId?: string;
  } | null>(null);

  // Auto-save emotion data mutation
  const saveEmotionMutation = useMutation({
    mutationFn: async (data: {
      sessionId: string;
      emotions: EmotionData;
      age?: number;
      gender?: string;
      confidence: number;
    }) => {
      const response = await apiRequest('POST', '/api/emotions', data);
      return response.json();
    },
    onError: (error) => {
      console.error('Failed to save emotion data:', error);
    }
  });

  // Load Face-API models on mount
  useEffect(() => {
    const initModels = async () => {
      try {
        await loadFaceApiModels();
        setIsModelsLoaded(true);
      } catch (error) {
        console.error('Failed to load Face-API models:', error);
      }
    };

    initModels();
  }, []);

  const startDetection = () => {
    if (!isModelsLoaded || !videoElement || !canvasElement || isDetecting) {
      return;
    }

    setIsDetecting(true);

    // Start face detection loop (every 500ms for smooth detection)
    detectionIntervalRef.current = setInterval(async () => {
      try {
        const result = await detectFaceEmotions(videoElement, canvasElement);
        
        if (result) {
          const sessionId = getCurrentSessionId();
          lastDetectionRef.current = {
            emotions: result.emotions,
            age: result.age,
            gender: result.gender,
            sessionId: sessionId || undefined
          };

          // Notify parent component
          onDetection(result.emotions, result.age, result.gender);
        }
      } catch (error) {
        console.error('Face detection error:', error);
      }
    }, 500);

    // Start auto-save loop (every 5 seconds)
    autoSaveIntervalRef.current = setInterval(() => {
      if (lastDetectionRef.current) {
        const sessionId = getCurrentSessionId();
        if (sessionId) {
          saveEmotionMutation.mutate({
            sessionId,
            emotions: lastDetectionRef.current.emotions,
            age: lastDetectionRef.current.age,
            gender: lastDetectionRef.current.gender,
            confidence: 85 // Default confidence level
          });
        }
      }
    }, 5000);
  };

  const stopDetection = () => {
    setIsDetecting(false);

    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }

    if (autoSaveIntervalRef.current) {
      clearInterval(autoSaveIntervalRef.current);
      autoSaveIntervalRef.current = null;
    }

    // Clear canvas
    if (canvasElement) {
      const ctx = canvasElement.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
      }
    }
  };

  // Get current session ID from localStorage
  const getCurrentSessionId = (): string | null => {
    const sessionData = localStorage.getItem('emotional_ai_session');
    if (sessionData) {
      const session = JSON.parse(sessionData);
      return session.id;
    }
    return null;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopDetection();
    };
  }, []);

  return {
    isModelsLoaded,
    isDetecting,
    startDetection,
    stopDetection
  };
}
