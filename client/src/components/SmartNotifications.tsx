import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type { EmotionData } from "@shared/schema";

interface SmartNotificationsProps {
  currentEmotions: EmotionData | null;
  sessionDuration: number;
}

interface Notification {
  id: string;
  type: 'tip' | 'warning' | 'success' | 'info';
  title: string;
  message: string;
  action?: string;
  persistent?: boolean;
}

export default function SmartNotifications({ currentEmotions, sessionDuration }: SmartNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const { data: providers = [] } = useQuery<Array<{name: string; configured: boolean}>>({
    queryKey: ['/api/ai-providers']
  });

  const hasAI = providers.some(p => p.configured);

  useEffect(() => {
    const newNotifications: Notification[] = [];

    // Smart AI Setup Suggestion
    if (!hasAI && sessionDuration > 30 && !dismissed.has('ai-setup')) {
      newNotifications.push({
        id: 'ai-setup',
        type: 'tip',
        title: '🚀 حسن تجربتك',
        message: 'احصل على ردود أكثر ذكاءً بإضافة مفتاح ذكاء اصطناعي مجاني من Gemini',
        action: 'إعداد الآن'
      });
    }

    // Emotion Analysis Tips
    if (currentEmotions && sessionDuration > 60) {
      const dominantEmotion = Object.entries(currentEmotions).reduce((a, b) => a[1] > b[1] ? a : b);
      const emotionName = dominantEmotion[0];
      const emotionIntensity = dominantEmotion[1];

      if (emotionName === 'sad' && emotionIntensity > 70 && !dismissed.has('sad-support')) {
        newNotifications.push({
          id: 'sad-support',
          type: 'info',
          title: '💙 نحن هنا لك',
          message: 'أشعر بحزنك. تذكر أن التحدث يساعد، وهذه المشاعر طبيعية ومؤقتة.',
          persistent: true
        });
      }

      if (emotionName === 'angry' && emotionIntensity > 60 && !dismissed.has('anger-calm')) {
        newNotifications.push({
          id: 'anger-calm',
          type: 'warning',
          title: '🌱 خذ نفساً عميقاً',
          message: 'أرى أنك منزعج. جرب تمرين التنفس العميق: ادخل الهواء 4 ثوان، احبسه 4، واخرجه 4 ثوان.',
        });
      }

      if (emotionName === 'happy' && emotionIntensity > 80 && !dismissed.has('happy-celebration')) {
        newNotifications.push({
          id: 'happy-celebration',
          type: 'success',
          title: '🎉 أحب سعادتك!',
          message: 'هذه لحظة جميلة! شاركني ما يجعلك تشعر بهذا الفرح.',
        });
      }
    }

    // Long Session Wellness Check
    if (sessionDuration > 300 && !dismissed.has('wellness-break')) { // 5 minutes
      newNotifications.push({
        id: 'wellness-break',
        type: 'tip',
        title: '⏰ وقت الراحة',
        message: 'لقد كنت معي لفترة جيدة. ما رأيك في أخذ استراحة قصيرة؟',
      });
    }

    // Camera Usage Tip
    if (!currentEmotions && sessionDuration > 45 && !dismissed.has('camera-tip')) {
      newNotifications.push({
        id: 'camera-tip',
        type: 'info',
        title: '📷 تفعيل الكاميرا',
        message: 'لتجربة أفضل، فعل الكاميرا لأتمكن من تحليل مشاعرك وتقديم ردود أكثر تخصصاً.',
        action: 'كيف أفعلها؟'
      });
    }

    setNotifications(prev => {
      const existing = prev.filter(n => n.persistent);
      return [...existing, ...newNotifications.filter(n => !dismissed.has(n.id))];
    });
  }, [currentEmotions, sessionDuration, hasAI, dismissed]);

  const dismissNotification = (id: string) => {
    setDismissed(prev => new Set([...prev, id]));
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'tip': return 'bi-lightbulb';
      case 'warning': return 'bi-exclamation-triangle';
      case 'success': return 'bi-check-circle';
      case 'info': return 'bi-info-circle';
      default: return 'bi-bell';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'tip': return 'from-blue-500/20 to-blue-400/20 border-blue-500/30';
      case 'warning': return 'from-orange-500/20 to-orange-400/20 border-orange-500/30';
      case 'success': return 'from-green-500/20 to-green-400/20 border-green-500/30';
      case 'info': return 'from-purple-500/20 to-purple-400/20 border-purple-500/30';
      default: return 'from-gray-500/20 to-gray-400/20 border-gray-500/30';
    }
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 left-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`glassmorphism bg-gradient-to-r ${getNotificationColor(notification.type)} border rounded-lg p-4 shadow-lg animate-slide-in-left`}
        >
          <div className="flex items-start gap-3">
            <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${getNotificationColor(notification.type).replace('/20', '/50').replace('/30', '/60')} flex items-center justify-center flex-shrink-0`}>
              <i className={`bi ${getNotificationIcon(notification.type)} text-white text-sm`}></i>
            </div>
            
            <div className="flex-1">
              <h4 className="font-semibold text-white text-sm mb-1">
                {notification.title}
              </h4>
              <p className="text-gray-200 text-xs leading-relaxed">
                {notification.message}
              </p>
              
              {notification.action && (
                <button className="mt-2 text-xs text-blue-300 hover:text-blue-200 underline">
                  {notification.action}
                </button>
              )}
            </div>

            <button
              onClick={() => dismissNotification(notification.id)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <i className="bi bi-x text-sm"></i>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}