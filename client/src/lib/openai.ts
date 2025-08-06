// This file is not used directly in the frontend
// OpenAI integration is handled on the server side
// This is kept for reference or future client-side implementations

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface EmotionalContext {
  dominantEmotion: string;
  intensity: number;
  confidence: number;
}

// Placeholder for potential client-side OpenAI integration
export function formatEmotionalPrompt(
  message: string, 
  context: EmotionalContext
): string {
  return `المستخدم يشعر بـ ${context.dominantEmotion} بنسبة ${context.intensity}%. الرسالة: "${message}"`;
}

export function getEmotionArabicName(emotion: string): string {
  const emotionMap: Record<string, string> = {
    happy: 'السعادة',
    sad: 'الحزن',
    angry: 'الغضب',
    surprised: 'التفاجؤ',
    fearful: 'الخوف',
    disgusted: 'الاشمئزاز',
    neutral: 'الحياد'
  };
  
  return emotionMap[emotion] || emotion;
}
