import { Badge } from "@/components/ui/badge";
import { Bot, User as UserIcon, Heart, Smile, Frown, Angry, Zap, Meh } from "lucide-react";
import type { ChatMessage, EmotionData } from "@shared/schema";

interface EnhancedMessageDisplayProps {
  message: ChatMessage;
  isUser: boolean;
}

const getEmotionIcon = (emotion: string) => {
  switch (emotion) {
    case 'happy': return <Smile className="w-3 h-3 text-yellow-400" />;
    case 'sad': return <Frown className="w-3 h-3 text-blue-400" />;
    case 'angry': return <Angry className="w-3 h-3 text-red-400" />;
    case 'surprised': return <Zap className="w-3 h-3 text-green-400" />;
    case 'fearful': return <Heart className="w-3 h-3 text-purple-400" />;
    case 'disgusted': return <Meh className="w-3 h-3 text-orange-400" />;
    default: return <Meh className="w-3 h-3 text-gray-400" />;
  }
};

const getEmotionArabic = (emotion: string): string => {
  const emotionMap = {
    happy: "سعادة",
    sad: "حزن", 
    angry: "غضب",
    surprised: "تفاجؤ",
    fearful: "خوف",
    disgusted: "اشمئزاز",
    neutral: "حياد"
  };
  return emotionMap[emotion as keyof typeof emotionMap] || emotion;
};

export default function EnhancedMessageDisplay({ message, isUser }: EnhancedMessageDisplayProps) {
  const emotions = message.emotionContext as EmotionData;
  const dominantEmotion = emotions ? Object.entries(emotions).reduce((a, b) => a[1] > b[1] ? a : b) : null;
  
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        isUser 
          ? 'bg-gradient-to-r from-primary to-secondary smooth-pulse' 
          : 'bg-gradient-to-r from-accent to-primary smooth-pulse'
      }`}>
        {isUser ? <UserIcon className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
      </div>

      {/* Message Bubble */}
      <div className={`max-w-[80%] ${
        isUser ? 'chat-bubble-user' : 'chat-bubble-ai'
      } p-4 emotion-glow`}>
        
        {/* Message Content */}
        <p className="leading-relaxed text-sm md:text-base font-medium">
          {message.content}
        </p>
        
        {/* Emotion Display */}
        {dominantEmotion && (
          <div className="mt-3 flex items-center gap-2 text-xs">
            {getEmotionIcon(dominantEmotion[0])}
            <Badge variant="secondary" className="text-xs bg-background/50 border-border/50">
              {getEmotionArabic(dominantEmotion[0])} ({Math.round(dominantEmotion[1])}%)
            </Badge>
          </div>
        )}
        
        {/* Timestamp */}
        <p className="text-xs text-muted-foreground mt-2 opacity-70">
          {message.timestamp ? new Date(message.timestamp).toLocaleTimeString('ar-SA', {
            hour: '2-digit',
            minute: '2-digit'
          }) : 'الآن'}
        </p>
      </div>
    </div>
  );
}