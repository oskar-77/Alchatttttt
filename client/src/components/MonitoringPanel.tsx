import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import CameraFeed from "./CameraFeed";
import EmotionAnalysis from "./EmotionAnalysis";
import type { User, Session, EmotionData } from "@shared/schema";

interface MonitoringPanelProps {
  user: User;
  session: Session;
  currentEmotions: EmotionData | null;
  onEmotionUpdate: (emotions: EmotionData, age?: number, gender?: string) => void;
  isMobile?: boolean;
}

export default function MonitoringPanel({ 
  user, 
  session, 
  currentEmotions, 
  onEmotionUpdate,
  isMobile = false 
}: MonitoringPanelProps) {
  const [sessionDuration, setSessionDuration] = useState(0);

  // Fetch session statistics
  const { data: stats } = useQuery<{
    duration: number;
    detections: number;
    averageConfidence: number;
    dominantEmotion: string;
    messageCount: number;
    latestEmotions: any;
  }>({
    queryKey: ['/api/sessions', session.id, 'stats'],
    refetchInterval: 5000, // Update every 5 seconds
    enabled: !!session.id
  });

  // Update session duration every second
  useEffect(() => {
    const interval = setInterval(() => {
      if (session.startTime) {
        const duration = Math.floor((Date.now() - new Date(session.startTime).getTime()) / 1000);
        setSessionDuration(duration);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [session.startTime]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getGenderArabic = (gender: string) => {
    const genderMap = { male: 'ذكر', female: 'أنثى', unknown: 'غير محدد' };
    return genderMap[gender as keyof typeof genderMap] || gender;
  };

  const getDominantEmotionArabic = (emotion: string) => {
    const emotionMap = {
      happy: 'سعادة',
      sad: 'حزن', 
      angry: 'غضب',
      surprised: 'تفاجؤ',
      fearful: 'خوف',
      disgusted: 'اشمئزاز',
      neutral: 'محايد'
    };
    return emotionMap[emotion as keyof typeof emotionMap] || emotion;
  };

  return (
    <div className="flex flex-col border-r border-white/10 h-full">
      {/* Camera Feed */}
      <CameraFeed 
        session={session}
        onEmotionUpdate={onEmotionUpdate}
        isMobile={isMobile}
      />

      {/* Analysis Panels */}
      <div className="flex-1 overflow-y-auto scrollbar-hidden p-4 space-y-4">
        
        {/* User Identity */}
        <div className="glassmorphism p-4 rounded-xl">
          <h4 className="text-md font-semibold text-gray-200 mb-3 flex items-center gap-2">
            <i className="bi bi-person-badge text-accent"></i>
            هوية المستخدم
          </h4>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">الاسم:</span>
              <span className="text-white">
                {user.name.startsWith('ضيف_') ? 'ضيف' : user.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">العمر:</span>
              <span className="text-blue-400">
                {user.age ? `~${user.age} سنة` : 'غير محدد'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">الجنس:</span>
              <span className="text-blue-400">
                {getGenderArabic(user.gender || 'unknown')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">مستوى الثقة:</span>
              <span className="text-success">
                {stats?.averageConfidence || 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Live Emotions */}
        <EmotionAnalysis emotions={currentEmotions} />

        {/* Session Statistics */}
        <div className="glassmorphism p-4 rounded-xl">
          <h4 className="text-md font-semibold text-gray-200 mb-3 flex items-center gap-2">
            <i className="bi bi-graph-up text-accent"></i>
            إحصائيات الجلسة
          </h4>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-r from-primary/20 to-secondary/20 p-3 rounded-lg border border-primary/30">
              <div className="text-lg font-bold text-white">
                {formatDuration(sessionDuration)}
              </div>
              <div className="text-xs text-gray-400">وقت الجلسة</div>
            </div>
            
            <div className="bg-gradient-to-r from-success/20 to-green-400/20 p-3 rounded-lg border border-success/30">
              <div className="text-lg font-bold text-white">
                {stats?.detections || 0}
              </div>
              <div className="text-xs text-gray-400">عدد التحليلات</div>
            </div>
            
            <div className="bg-gradient-to-r from-accent/20 to-pink-400/20 p-3 rounded-lg border border-accent/30">
              <div className="text-lg font-bold text-white">
                {stats?.averageConfidence || 0}%
              </div>
              <div className="text-xs text-gray-400">دقة الكشف</div>
            </div>
            
            <div className="bg-gradient-to-r from-warning/20 to-yellow-400/20 p-3 rounded-lg border border-warning/30">
              <div className="text-lg font-bold text-white">
                {stats?.messageCount || 0}
              </div>
              <div className="text-xs text-gray-400">الرسائل</div>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="glassmorphism p-4 rounded-xl">
          <h4 className="text-md font-semibold text-gray-200 mb-3 flex items-center gap-2">
            <i className="bi bi-cpu text-accent"></i>
            حالة النظام
          </h4>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Face-API Models</span>
              <span className="text-success flex items-center gap-1">
                <i className="bi bi-check-circle-fill"></i>
                محمل
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-400">AI Assistant</span>
              <span className="text-success flex items-center gap-1">
                <i className="bi bi-check-circle-fill"></i>
                متصل
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-400">حفظ تلقائي</span>
              <span className="text-warning flex items-center gap-1">
                <i className="bi bi-clock"></i>
                كل 5 ثوان
              </span>
            </div>
          </div>
        </div>

        {/* Activity Log */}
        <div className="glassmorphism p-4 rounded-xl">
          <h4 className="text-md font-semibold text-gray-200 mb-3 flex items-center gap-2">
            <i className="bi bi-list-ul text-accent"></i>
            سجل النشاط
          </h4>
          
          <div className="space-y-2 text-xs max-h-32 overflow-y-auto scrollbar-hidden">
            {currentEmotions && (
              <div className="flex items-center gap-2 text-success">
                <i className="bi bi-check-circle-fill"></i>
                <span>تم حفظ تحليل المشاعر</span>
                <span className="text-gray-500 mr-auto">الآن</span>
              </div>
            )}
            
            {stats && stats.messageCount > 0 && (
              <div className="flex items-center gap-2 text-blue-400">
                <i className="bi bi-chat-dots"></i>
                <span>رسالة جديدة من المستخدم</span>
                <span className="text-gray-500 mr-auto">منذ دقيقة</span>
              </div>
            )}
            
            <div className="flex items-center gap-2 text-warning">
              <i className="bi bi-camera-video"></i>
              <span>بدء جلسة مراقبة جديدة</span>
              <span className="text-gray-500 mr-auto">
                {formatDuration(sessionDuration)}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
