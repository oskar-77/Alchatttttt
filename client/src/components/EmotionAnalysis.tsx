import type { EmotionData } from "@shared/schema";

interface EmotionAnalysisProps {
  emotions: EmotionData | null;
}

export default function EmotionAnalysis({ emotions }: EmotionAnalysisProps) {
  const emotionConfig = {
    happy: { 
      icon: "😊", 
      label: "سعادة", 
      color: "from-yellow-400 to-orange-400" 
    },
    neutral: { 
      icon: "😐", 
      label: "طبيعي", 
      color: "from-gray-400 to-gray-500" 
    },
    sad: { 
      icon: "😔", 
      label: "حزن", 
      color: "from-blue-400 to-blue-500" 
    },
    angry: { 
      icon: "😠", 
      label: "غضب", 
      color: "from-red-400 to-red-500" 
    },
    surprised: { 
      icon: "😮", 
      label: "تفاجؤ", 
      color: "from-purple-400 to-purple-500" 
    },
    fearful: { 
      icon: "😨", 
      label: "خوف", 
      color: "from-indigo-400 to-indigo-500" 
    },
    disgusted: { 
      icon: "🤢", 
      label: "اشمئزاز", 
      color: "from-green-400 to-green-500" 
    }
  };

  if (!emotions) {
    return (
      <div className="glassmorphism p-4 rounded-xl">
        <h4 className="text-md font-semibold text-gray-200 mb-3 flex items-center gap-2">
          <i className="bi bi-emoji-smile text-accent"></i>
          تحليل المشاعر المباشر
        </h4>
        <div className="text-center py-8 text-gray-400">
          <i className="bi bi-camera-video-off text-2xl mb-2"></i>
          <p className="text-sm">في انتظار بيانات المشاعر...</p>
        </div>
      </div>
    );
  }

  // Sort emotions by value (highest first)
  const sortedEmotions = Object.entries(emotions)
    .sort(([,a], [,b]) => b - a)
    .filter(([,value]) => value > 0); // Only show emotions with values > 0

  return (
    <div className="glassmorphism p-4 rounded-xl">
      <h4 className="text-md font-semibold text-gray-200 mb-3 flex items-center gap-2">
        <i className="bi bi-emoji-smile text-accent"></i>
        تحليل المشاعر المباشر
      </h4>
      
      <div className="space-y-3">
        {sortedEmotions.map(([emotion, value]) => {
          const config = emotionConfig[emotion as keyof typeof emotionConfig];
          if (!config) return null;

          return (
            <div key={emotion}>
              <div className="flex items-center justify-between text-sm mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{config.icon}</span>
                  <span className="text-gray-300">{config.label}</span>
                </div>
                <span className="font-medium text-white">
                  {Math.round(value)}%
                </span>
              </div>
              <div className="emotion-bar">
                <div 
                  className={`emotion-fill bg-gradient-to-r ${config.color}`}
                  style={{ width: `${value}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {sortedEmotions.length === 0 && (
        <div className="text-center py-4 text-gray-400">
          <p className="text-sm">لا توجد مشاعر مكتشفة</p>
        </div>
      )}
    </div>
  );
}
