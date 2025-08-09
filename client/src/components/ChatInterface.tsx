import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
// Removed formatTime import - using local function instead
import { useToast } from "@/hooks/use-toast";
import ProviderStatus from "@/components/ProviderStatus";
import SmartWelcomeMessage from "@/components/SmartWelcomeMessage";
import AIProviderSettings from "@/components/AIProviderSettings";
import APIHealthMonitor from "@/components/APIHealthMonitor";
import { MessageCircle, Send, Settings, User as UserIcon, Bot, Sparkles, TestTube, CheckCircle, XCircle, Loader } from "lucide-react";
import EnhancedMessageDisplay from "@/components/EnhancedMessageDisplay";
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
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [testMessage, setTestMessage] = useState("مرحباً، كيف حالك اليوم؟");
  const [testResult, setTestResult] = useState<{success: boolean; response?: string; provider?: string; error?: string} | null>(null);
  const [isTestLoading, setIsTestLoading] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

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

  const handleTestAPI = async () => {
    if (!testMessage.trim()) return;
    
    setIsTestLoading(true);
    setTestResult(null);
    
    try {
      const mockEmotions = {
        happy: 50,
        sad: 20,
        angry: 10,
        surprised: 5,
        fearful: 5,
        disgusted: 5,
        neutral: 5
      };

      const response = await apiRequest('POST', '/api/test-ai-provider', {
        provider: 'auto',
        message: testMessage,
        emotions: mockEmotions
      });

      const result = await response.json();
      
      if (result.success) {
        setTestResult({
          success: true,
          response: result.response,
          provider: result.provider
        });
        toast({
          title: "نجح الاختبار! ✅",
          description: `تم الاختبار بواسطة: ${result.provider}`,
          variant: "default"
        });
      } else {
        throw new Error(result.error || 'Test failed');
      }
    } catch (error: any) {
      setTestResult({
        success: false,
        error: error.message || 'Unknown error'
      });
      toast({
        title: "فشل الاختبار ❌",
        description: error.message || 'حدث خطأ أثناء الاختبار',
        variant: "destructive"
      });
    } finally {
      setIsTestLoading(false);
    }
  };

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const getEmotionDisplay = (emotions: EmotionData | null): React.ReactNode => {
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
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center emotion-glow floating-animation">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gradient">المساعد العاطفي الذكي</h2>
              <div className="flex items-center gap-3">
                <p className="text-sm text-muted-foreground">
                  {currentEmotions ? "متصل - يحلل المشاعر" : "متصل - في انتظار الكاميرا"}
                </p>
                <ProviderStatus />
              </div>
            </div>
          </div>
          
          <div className="mobile-flex gap-2">
            {/* API Health Monitor */}
            <APIHealthMonitor />
            
            {/* API Test Button */}
            <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="button-modern border-warning/50 text-warning hover:bg-warning/20">
                  <TestTube className="w-4 h-4 ml-2" />
                  اختبار سريع
                </Button>
              </DialogTrigger>
              <DialogContent className="glassmorphism border-white/20 max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-gradient flex items-center gap-2">
                    <TestTube className="w-5 h-5" />
                    اختبار مزود الذكاء الاصطناعي
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">رسالة الاختبار:</label>
                    <Textarea
                      placeholder="أدخل رسالة لاختبار الذكاء الاصطناعي..."
                      value={testMessage}
                      onChange={(e) => setTestMessage(e.target.value)}
                      className="bg-gray-900/80 border-gray-600/50 text-white placeholder:text-gray-400 focus:border-primary/50 focus:ring-primary/30 min-h-[80px]"
                    />
                  </div>
                  
                  {testResult && (
                    <div className={`p-4 rounded-lg border ${testResult.success 
                      ? 'bg-success/10 border-success/30' 
                      : 'bg-destructive/10 border-destructive/30'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        {testResult.success ? (
                          <CheckCircle className="w-5 h-5 text-success" />
                        ) : (
                          <XCircle className="w-5 h-5 text-destructive" />
                        )}
                        <span className="font-medium">
                          {testResult.success ? 'نجح الاختبار!' : 'فشل الاختبار'}
                        </span>
                      </div>
                      {testResult.success ? (
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground">
                            المزود: {testResult.provider}
                          </p>
                          <p className="text-sm">{testResult.response}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-destructive">{testResult.error}</p>
                      )}
                    </div>
                  )}
                  
                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowTestDialog(false)}
                      className="flex-1"
                    >
                      إغلاق
                    </Button>
                    <Button 
                      onClick={handleTestAPI}
                      className="flex-1 button-modern bg-gradient-to-r from-primary to-secondary"
                      disabled={!testMessage.trim() || isTestLoading}
                    >
                      {isTestLoading ? (
                        <Loader className="w-4 h-4 animate-spin ml-2" />
                      ) : (
                        <Sparkles className="w-4 h-4 ml-2" />
                      )}
                      {isTestLoading ? "جاري الاختبار..." : "اختبار"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {user.name.startsWith('ضيف_') && (
              <Dialog open={showRegisterDialog} onOpenChange={setShowRegisterDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="button-modern border-success/50 text-success hover:bg-success/20">
                    <UserIcon className="w-4 h-4 ml-2" />
                    تسجيل
                  </Button>
                </DialogTrigger>
                <DialogContent className="glassmorphism border-white/20">
                  <DialogHeader>
                    <DialogTitle className="text-gradient flex items-center gap-2">
                      <UserIcon className="w-5 h-5" />
                      تسجيل مستخدم جديد
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="الاسم الكامل"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="bg-gray-900/80 border-gray-600/50 text-white placeholder:text-gray-400 focus:border-primary/50 focus:ring-primary/30"
                    />
                    <Input
                      placeholder="البريد الإلكتروني (اختياري)"
                      type="email"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      className="bg-gray-900/80 border-gray-600/50 text-white placeholder:text-gray-400 focus:border-primary/50 focus:ring-primary/30"
                    />
                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                      <MessageCircle className="w-3 h-3" />
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
                        className="flex-1 button-enhanced"
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
              className="button-modern border-border hover:bg-muted/50"
              onClick={() => setShowSettingsDialog(true)}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-hidden p-6 space-y-4 scroll-smooth">
        {/* Smart Welcome Message */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-accent to-primary flex items-center justify-center flex-shrink-0 floating-animation">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <SmartWelcomeMessage userName={user.name} />
        </div>

        {/* Chat Messages */}
        {messages.map((msg: ChatMessage) => (
          <div key={msg.id} className={`flex items-start gap-3 ${msg.isUser ? 'justify-end' : ''}`}>
            {msg.isUser ? (
              <>
                <div className="chat-bubble-user p-4 max-w-md sm:max-w-xs md:max-w-md text-white card-hover">
                  <p className="leading-relaxed">{msg.content}</p>
                  {msg.emotionContext && (
                    <div className="mt-2">
                      {getEmotionDisplay(msg.emotionContext as EmotionData | null)}
                    </div>
                  )}
                  <span className="text-xs text-white/70 mt-2 block">
                    {formatTime(msg.timestamp!)}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-success to-accent flex items-center justify-center flex-shrink-0">
                  <UserIcon className="w-4 h-4 text-white" />
                </div>
              </>
            ) : (
              <>
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-accent to-primary flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="chat-bubble-ai p-4 max-w-md sm:max-w-xs md:max-w-md card-hover">
                  <p className="text-foreground leading-relaxed">{msg.content}</p>
                  <span className="text-xs text-muted-foreground mt-2 block">
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
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-accent to-primary flex items-center justify-center flex-shrink-0 smooth-pulse">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="chat-bubble-ai p-4 emotion-glow">
              <div className="typing-indicator">
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
              <span className="text-xs text-muted-foreground mt-2 block">يكتب...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="glassmorphism p-4 border-t border-border/30">
        <form onSubmit={handleSendMessage} className="mobile-flex gap-3">
          <div className="flex-1 relative">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="اكتب رسالتك هنا..."
              className="input-enhanced bg-gray-900/90 border-gray-600/60 text-white placeholder:text-gray-400 rounded-full pr-4 pl-12 py-3 h-12 focus:ring-2 focus:ring-primary/50 focus:border-primary/50 focus:bg-gray-800/90 hover:bg-gray-800/80 transition-all duration-300 backdrop-blur-sm"
              disabled={sendMessageMutation.isPending}
            />
            <MessageCircle className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          </div>
          
          <Button 
            type="submit"
            size="icon"
            className="button-enhanced rounded-full hover:scale-105 w-12 h-12 flex-shrink-0"
            disabled={!message.trim() || sendMessageMutation.isPending}
          >
            {sendMessageMutation.isPending ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </form>

        {/* Emotion Status */}
        {currentEmotions && (
          <div className="mt-3 p-3 bg-muted/30 rounded-lg card-hover">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                الحالة العاطفية الحالية
              </span>
              <span>دقة: {user.age ? '87%' : 'غير محدد'}</span>
            </div>
            <div className="mobile-grid gap-2 text-xs">
              {Object.entries(currentEmotions)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 4)
                .map(([emotion, value]) => (
                  <div key={emotion} className="flex items-center justify-between">
                    <span className={`emotion-${emotion}`}>
                      {getEmotionIcon(emotion)} {getEmotionArabic(emotion)}
                    </span>
                    <span className="text-primary font-medium">{Math.round(value)}%</span>
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
