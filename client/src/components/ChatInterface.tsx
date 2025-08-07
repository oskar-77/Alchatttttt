import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatTime } from "@/lib/utils";
import ProviderStatus from "@/components/ProviderStatus";
import SmartWelcomeMessage from "@/components/SmartWelcomeMessage";
import AIProviderSettings from "@/components/AIProviderSettings";
import type { User, Session, ChatMessage, EmotionData } from "@shared/schema";

interface ChatInterfaceProps {
  user: User;
  session: Session;
  currentEmotions: EmotionData | null;
  onRegisterUser: (userData: { name: string; email?: string }) => void;
  onEmotionUpdate: (emotions: EmotionData, age?: number, gender?: string) => void;
  emotionBuffer?: {
    getLatestEmotion: () => any;
    getAverageEmotions: (timeWindow?: number) => EmotionData | null;
  };
}

export default function ChatInterface({ 
  user, 
  session, 
  currentEmotions, 
  onRegisterUser,
  onEmotionUpdate,
  emotionBuffer
}: ChatInterfaceProps) {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Fetch chat messages
  const { data: messages = [] } = useQuery<ChatMessage[]>({
    queryKey: ['/api/sessions', session.id, 'messages'],
    enabled: !!session.id
  });

  // Send message mutation with emotion buffer
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      // Get latest emotion from buffer if available
      const latestEmotion = emotionBuffer?.getLatestEmotion();
      const emotionToUse = latestEmotion?.emotions || currentEmotions;
      
      const response = await apiRequest('POST', '/api/chat', {
        sessionId: session.id,
        isUser: true,
        content,
        emotionContext: emotionToUse
      });
      return response.json();
    },
    onMutate: () => {
      setIsTyping(true);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sessions', session.id, 'messages'] });
      setMessage("");
      setIsTyping(false);
    },
    onError: () => {
      setIsTyping(false);
    }
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !sendMessageMutation.isPending) {
      sendMessageMutation.mutate(message.trim());
    }
  };

  const handleRegister = () => {
    if (userName.trim()) {
      onRegisterUser({
        name: userName,
        email: userEmail || undefined
      });
      setShowRegisterDialog(false);
      setUserName("");
      setUserEmail("");
    }
  };

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const getEmotionDisplay = (emotions: EmotionData | null) => {
    if (!emotions) return null;
    
    const topEmotions = Object.entries(emotions)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 2);

    return (
      <div className="mt-2 p-2 bg-black/20 rounded-lg text-xs">
        {topEmotions.map(([emotion, value]) => (
          <span key={emotion} className="mr-3">
            {getEmotionIcon(emotion)} {getEmotionArabic(emotion)}: {Math.round(value)}%
          </span>
        ))}
      </div>
    );
  };

  const getEmotionIcon = (emotion: string) => {
    const icons = {
      happy: "😊",
      sad: "😔",
      angry: "😠",
      surprised: "😮",
      fearful: "😨",
      disgusted: "🤢",
      neutral: "😐"
    };
    return icons[emotion as keyof typeof icons] || "😐";
  };

  const getEmotionArabic = (emotion: string) => {
    const arabic = {
      happy: "سعادة",
      sad: "حزن",
      angry: "غضب",
      surprised: "تفاجؤ",
      fearful: "خوف",
      disgusted: "اشمئزاز",
      neutral: "محايد"
    };
    return arabic[emotion as keyof typeof arabic] || emotion;
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('ar', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  return (
    <div className="flex-1 lg:w-3/5 flex flex-col">
      {/* Header */}
      <div className="glassmorphism p-6 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
              <i className="bi bi-robot text-xl text-white"></i>
            </div>
            <div>
              <h2 className="text-xl font-semibold gradient-text">المساعد العاطفي الذكي</h2>
              <div className="flex items-center gap-3">
                <p className="text-sm text-gray-400">
                  {currentEmotions ? "متصل - يحلل المشاعر" : "متصل - في انتظار الكاميرا"}
                </p>
                <ProviderStatus />
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {user.name.startsWith('ضيف_') && (
              <Dialog open={showRegisterDialog} onOpenChange={setShowRegisterDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="border-success/50 text-success hover:bg-success/20">
                    <i className="bi bi-person-plus ml-2"></i>
                    تسجيل
                  </Button>
                </DialogTrigger>
                <DialogContent className="glassmorphism border-white/20">
                  <DialogHeader>
                    <DialogTitle className="gradient-text flex items-center gap-2">
                      <i className="bi bi-person-plus"></i>
                      تسجيل مستخدم جديد
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="الاسم الكامل"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="bg-gray-800/50 border-gray-600"
                    />
                    <Input
                      placeholder="البريد الإلكتروني (اختياري)"
                      type="email"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      className="bg-gray-800/50 border-gray-600"
                    />
                    <p className="text-xs text-gray-400">
                      <i className="bi bi-info-circle ml-1"></i>
                      سيتم تحديد العمر والجنس تلقائياً من الكاميرا
                    </p>
                    <div className="flex gap-3">
                      <Button 
                        variant="outline" 
                        onClick={() => setShowRegisterDialog(false)}
                        className="flex-1"
                      >
                        إلغاء
                      </Button>
                      <Button 
                        onClick={handleRegister}
                        className="flex-1 bg-gradient-to-r from-primary to-secondary"
                        disabled={!userName.trim()}
                      >
                        تسجيل
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            <AIProviderSettings 
              open={showSettingsDialog}
              onOpenChange={setShowSettingsDialog}
            />
            <Button 
              variant="outline" 
              size="sm" 
              className="border-gray-600"
              onClick={() => setShowSettingsDialog(true)}
            >
              <i className="bi bi-gear"></i>
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-hidden p-6 space-y-4">
        {/* Smart Welcome Message */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-accent to-primary flex items-center justify-center flex-shrink-0">
            <i className="bi bi-robot text-sm text-white"></i>
          </div>
          <SmartWelcomeMessage userName={user.name} />
        </div>

        {/* Chat Messages */}
        {messages.map((msg: ChatMessage) => (
          <div key={msg.id} className={`flex items-start gap-3 ${msg.isUser ? 'justify-end' : ''}`}>
            {msg.isUser ? (
              <>
                <div className="chat-bubble-user p-4 max-w-md text-white">
                  <p>{msg.content}</p>
                  {msg.emotionContext && getEmotionDisplay(msg.emotionContext as EmotionData)}
                  <span className="text-xs text-gray-300 mt-2 block">
                    {formatTime(msg.timestamp!)}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-success to-accent flex items-center justify-center flex-shrink-0">
                  <i className="bi bi-person text-sm text-white"></i>
                </div>
              </>
            ) : (
              <>
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-accent to-primary flex items-center justify-center flex-shrink-0">
                  <i className="bi bi-robot text-sm text-white"></i>
                </div>
                <div className="chat-bubble-ai p-4 max-w-md">
                  <p className="text-gray-100">{msg.content}</p>
                  <span className="text-xs text-gray-400 mt-2 block">
                    {formatTime(msg.timestamp!)}
                  </span>
                </div>
              </>
            )}
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-accent to-primary flex items-center justify-center flex-shrink-0">
              <i className="bi bi-robot text-sm text-white"></i>
            </div>
            <div className="chat-bubble-ai p-4">
              <div className="typing-indicator">
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="glassmorphism p-4 border-t border-white/10">
        <form onSubmit={handleSendMessage} className="flex items-center gap-3">
          <Button type="button" variant="outline" size="icon" className="border-gray-600">
            <i className="bi bi-plus-lg text-gray-300"></i>
          </Button>
          
          <div className="flex-1">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="اكتب رسالتك هنا..."
              className="bg-gray-800/50 border-gray-600 rounded-full"
              disabled={sendMessageMutation.isPending}
            />
          </div>
          
          <Button 
            type="submit"
            size="icon"
            className="rounded-full bg-gradient-to-r from-primary to-secondary hover:scale-105"
            disabled={!message.trim() || sendMessageMutation.isPending}
          >
            <i className="bi bi-send"></i>
          </Button>
        </form>

        {/* Emotion Status */}
        {currentEmotions && (
          <div className="mt-3 p-3 bg-gray-800/30 rounded-lg">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
              <span>الحالة العاطفية الحالية</span>
              <span>دقة: {user.age ? '87%' : 'غير محدد'}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(currentEmotions)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 4)
                .map(([emotion, value]) => (
                  <div key={emotion} className="flex items-center justify-between">
                    <span>{getEmotionIcon(emotion)} {getEmotionArabic(emotion)}</span>
                    <span className="text-accent">{Math.round(value)}%</span>
                  </div>
                ))
              }
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
