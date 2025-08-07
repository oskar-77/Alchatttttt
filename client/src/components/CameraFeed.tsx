import { useEffect, useRef, useState } from "react";
import { useFaceDetection } from "@/hooks/useFaceDetection";
import type { Session, EmotionData } from "@shared/schema";

interface CameraFeedProps {
  session: Session;
  onEmotionUpdate: (emotions: EmotionData, age?: number, gender?: string) => void;
  isMobile?: boolean;
}

export default function CameraFeed({ session, onEmotionUpdate, isMobile = false }: CameraFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraStatus, setCameraStatus] = useState<'loading' | 'active' | 'error'>('loading');
  const [isRecording, setIsRecording] = useState(false);

  const { 
    isModelsLoaded, 
    startDetection, 
    stopDetection,
    isDetecting 
  } = useFaceDetection({
    videoElement: videoRef.current,
    canvasElement: canvasRef.current,
    onDetection: (emotions, age, gender) => {
      onEmotionUpdate(emotions, age, gender);
    }
  });

  // Initialize camera
  useEffect(() => {
    let stream: MediaStream | null = null;

    const initCamera = async () => {
      try {
        setCameraStatus('loading');
        
        stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            width: 640, 
            height: 480,
            facingMode: 'user'
          }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.addEventListener('loadedmetadata', () => {
            if (canvasRef.current && videoRef.current) {
              canvasRef.current.width = videoRef.current.videoWidth;
              canvasRef.current.height = videoRef.current.videoHeight;
            }
            setCameraStatus('active');
          });
        }
      } catch (error) {
        console.error('Camera access error:', error);
        setCameraStatus('error');
      }
    };

    initCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Auto-start detection when models are loaded and camera is active (CONTINUOUS!)
  useEffect(() => {
    if (isModelsLoaded && cameraStatus === 'active' && !isDetecting) {
      // Start automatically and keep running continuously
      const timer = setTimeout(() => {
        handleStartRecording();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isModelsLoaded, cameraStatus]);

  // Keep detection running continuously while camera is active
  useEffect(() => {
    if (cameraStatus === 'active' && isModelsLoaded && !isDetecting) {
      handleStartRecording();
    }
    
    // Clean up when component unmounts or camera stops
    return () => {
      if (isDetecting) {
        handleStopRecording();
      }
    };
  }, [cameraStatus, isModelsLoaded]);

  const handleStartRecording = () => {
    if (isModelsLoaded && cameraStatus === 'active') {
      startDetection();
      setIsRecording(true);
    }
  };

  const handleStopRecording = () => {
    stopDetection();
    setIsRecording(false);
  };

  const getCameraStatusText = () => {
    switch (cameraStatus) {
      case 'loading': return 'جاري تشغيل الكاميرا...';
      case 'active': return isRecording ? 'كاميرا نشطة' : 'كاميرا متوقفة';
      case 'error': return 'خطأ في الكاميرا';
    }
  };

  const getCameraStatusColor = () => {
    switch (cameraStatus) {
      case 'loading': return 'text-yellow-400';
      case 'active': return isRecording ? 'text-green-400' : 'text-gray-400';
      case 'error': return 'text-red-400';
    }
  };

  return (
    <div className="glassmorphism p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold gradient-text">مراقبة مباشرة</h3>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-success pulse-animation' : 'bg-gray-400'}`}></div>
          <span className="text-xs text-gray-400">
            {isRecording ? 'مباشر' : 'متوقف'}
          </span>
        </div>
      </div>
      
      <div className="relative bg-gray-900 rounded-xl overflow-hidden border border-white/10 mb-4">
        <video 
          ref={videoRef}
          className={`camera-feed w-full object-cover ${isMobile ? 'h-32' : 'h-48'}`}
          autoPlay 
          muted 
          playsInline
        />
        <canvas 
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full camera-feed pointer-events-none"
        />
        
        {/* Camera Status Overlay */}
        <div className="absolute top-2 left-2 bg-black/50 px-2 py-1 rounded text-xs">
          <i className={`bi bi-camera-video ml-1 ${getCameraStatusColor()}`}></i>
          <span className={getCameraStatusColor()}>
            {getCameraStatusText()}
          </span>
        </div>

        {/* Models Loading Overlay */}
        {!isModelsLoaded && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm">جاري تحميل نماذج الذكاء الاصطناعي...</p>
            </div>
          </div>
        )}

        {/* Camera Error Overlay */}
        {cameraStatus === 'error' && (
          <div className="absolute inset-0 bg-red-900/20 flex items-center justify-center">
            <div className="text-center text-red-400">
              <i className="bi bi-camera-video-off text-2xl mb-2"></i>
              <p className="text-sm">فشل في الوصول للكاميرا</p>
            </div>
          </div>
        )}
      </div>

      {/* Control Buttons */}
      <div className="flex gap-2">
        {!isRecording ? (
          <button
            onClick={handleStartRecording}
            disabled={!isModelsLoaded || cameraStatus !== 'active'}
            className="flex-1 py-2 px-3 bg-gradient-to-r from-success to-green-400 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-transform"
          >
            <i className="bi bi-play-circle ml-1"></i>
            بدء التحليل
          </button>
        ) : (
          <button
            onClick={handleStopRecording}
            className="flex-1 py-2 px-3 bg-gradient-to-r from-destructive to-red-400 text-white rounded-lg text-sm font-medium hover:scale-105 transition-transform"
          >
            <i className="bi bi-stop-circle ml-1"></i>
            إيقاف التحليل
          </button>
        )}
      </div>
    </div>
  );
}
