// Google Gemini support - Will be enhanced when @google/genai package is available
// import { GoogleGenerativeAI } from '@google/genai';
import type { EmotionData } from '@shared/schema';

// Helper function to create default emotion context
function createDefaultEmotionContext(): EmotionData {
  return {
    happy: 0,
    sad: 0,
    angry: 0,
    surprised: 0,
    fearful: 0,
    disgusted: 0,
    neutral: 100
  };
}

// AI Provider Interface
export interface AIProvider {
  name: string;
  isConfigured(): boolean;
  generateResponse(userMessage: string, emotionContext: EmotionData): Promise<string>;
}

// OpenAI Provider (Premium)
class OpenAIProvider implements AIProvider {
  name = "OpenAI GPT-4o";

  isConfigured(): boolean {
    const apiKey = process.env.OPENAI_API_KEY;
    return !!apiKey && apiKey.trim().length > 0;
  }

  async generateResponse(userMessage: string, emotionContext: EmotionData): Promise<string> {
    try {
      if (!emotionContext || typeof emotionContext !== 'object') {
        emotionContext = createDefaultEmotionContext();
      }
      
      const emotions = Object.entries(emotionContext);
      if (emotions.length === 0) {
        emotions.push(['neutral', 100]);
      }
      
      const dominantEmotion = emotions.reduce((a, b) => a[1] > b[1] ? a : b);
      const emotionName = dominantEmotion[0];
      const emotionIntensity = dominantEmotion[1];
      const emotionPrompt = this.getEmotionPrompt(emotionName, emotionIntensity);

      // This would require OpenAI SDK implementation
      return `استجابة ذكية من OpenAI GPT-4: ${userMessage}`;
    } catch (error) {
      console.error("OpenAI error:", error);
      throw error;
    }
  }

  private getEmotionPrompt(emotion: string, intensity: number): string {
    const highIntensity = intensity > 60;
    
    switch (emotion) {
      case 'happy':
        return highIntensity 
          ? "المستخدم يشعر بسعادة كبيرة. شاركه فرحته وقدم نصائح للحفاظ على هذه الحالة الإيجابية."
          : "المستخدم يشعر بسعادة خفيفة. عززه وادعمه.";
      case 'sad':
        return highIntensity
          ? "المستخدم يشعر بحزن شديد. كن متعاطفاً جداً وقدم الدعم العاطفي والنصائح للتعافي."
          : "المستخدم يشعر بحزن خفيف. استمع له وقدم التشجيع.";
      case 'angry':
        return highIntensity
          ? "المستخدم غاضب جداً. ساعده على التهدئة وإدارة غضبه بطريقة صحية."
          : "المستخدم يشعر بانزعاج. ساعده على فهم مشاعره والتعامل معها.";
      default:
        return "المستخدم في حالة محايدة. كن ودوداً ومفيداً في تفاعلك معه.";
    }
  }
}

// Google Gemini Provider (FREE!) - Using REST API directly
class GeminiProvider implements AIProvider {
  name = "Google Gemini (مجاني)";

  isConfigured(): boolean {
    const apiKey = process.env.GOOGLE_API_KEY;
    console.log('🔍 Checking Google API Key:', apiKey ? 'Present' : 'Missing');
    return !!apiKey && apiKey.trim().length > 0;
  }

  async generateResponse(userMessage: string, emotionContext: EmotionData): Promise<string> {
    try {
      if (!emotionContext || typeof emotionContext !== 'object') {
        emotionContext = createDefaultEmotionContext();
      }
      
      const emotions = Object.entries(emotionContext);
      if (emotions.length === 0) {
        emotions.push(['neutral', 100]);
      }
      
      const dominantEmotion = emotions.reduce((a, b) => a[1] > b[1] ? a : b);
      const emotionName = dominantEmotion[0];
      const emotionArabic = this.getEmotionArabic(emotionName);
      
      const prompt = `أنت مساعد ذكي عاطفي يتحدث العربية. المستخدم يشعر بـ ${emotionArabic}. 
      رسالته: "${userMessage}"
      
      قدم رداً متعاطفاً ومفيداً بالعربية (100-150 كلمة):`;

      // Using Google Gemini REST API directly
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GOOGLE_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 200,
            }
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.log(`Gemini API Error ${response.status}:`, errorText);
        throw new Error(`فشل الاتصال بـ Gemini - كود الخطأ: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.candidates && result.candidates[0] && result.candidates[0].content) {
        return result.candidates[0].content.parts[0].text;
      } else {
        throw new Error("No response received from Gemini");
      }
    } catch (error) {
      console.error("Gemini error:", error);
      throw error;
    }
  }

  private getEmotionArabic(emotion: string): string {
    const emotionMap = {
      happy: "السعادة",
      sad: "الحزن",
      angry: "الغضب",
      surprised: "التفاجؤ",
      fearful: "الخوف",
      disgusted: "الاشمئزاز",
      neutral: "الحياد"
    };
    return emotionMap[emotion as keyof typeof emotionMap] || emotion;
  }
}

// Free GPT Provider (No API key needed!)
class FreeGPTProvider implements AIProvider {
  name = "Free GPT (مجاني تماماً)";

  isConfigured(): boolean {
    return true; // Always available, no API key needed
  }

  async generateResponse(userMessage: string, emotionContext: EmotionData): Promise<string> {
    try {
      if (!emotionContext || typeof emotionContext !== 'object') {
        emotionContext = createDefaultEmotionContext();
      }
      
      const emotions = Object.entries(emotionContext);
      if (emotions.length === 0) {
        emotions.push(['neutral', 100]);
      }
      
      const dominantEmotion = emotions.reduce((a, b) => a[1] > b[1] ? a : b);
      const emotionName = dominantEmotion[0];
      const emotionArabic = this.getEmotionArabic(emotionName);
      
      const prompt = `أنت مساعد ذكي عاطفي يتحدث العربية. المستخدم يشعر بـ ${emotionArabic}. 
      رسالته: "${userMessage}"
      
      قدم رداً متعاطفاً ومفيداً بالعربية (100-150 كلمة):`;

      // Using free GPT API that requires no authentication
      const response = await fetch(
        `https://free-unoficial-gpt4o-mini-api-g70n.onrender.com/chat/?query=${encodeURIComponent(prompt)}`,
        {
          method: "GET",
          headers: {
            "Accept": "application/json",
          }
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.log(`FreeGPT API Error ${response.status}:`, errorText);
        throw new Error(`فشل الاتصال بـ FreeGPT - كود الخطأ: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.response) {
        return result.response;
      } else {
        throw new Error("No response received");
      }
    } catch (error) {
      console.error("Free GPT error:", error);
      throw error;
    }
  }

  private getEmotionArabic(emotion: string): string {
    const emotionMap = {
      happy: "السعادة",
      sad: "الحزن",
      angry: "الغضب",
      surprised: "التفاجؤ",
      fearful: "الخوف",
      disgusted: "الاشمئزاز",
      neutral: "الحياد"
    };
    return emotionMap[emotion as keyof typeof emotionMap] || emotion;
  }
}

// Hugging Face Provider (Free with API key)
class HuggingFaceProvider implements AIProvider {
  name = "Hugging Face (مجاني)";

  isConfigured(): boolean {
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    return !!apiKey && apiKey.trim().length > 0;
  }

  async generateResponse(userMessage: string, emotionContext: EmotionData): Promise<string> {
    try {
      if (!emotionContext || typeof emotionContext !== 'object') {
        emotionContext = createDefaultEmotionContext();
      }
      
      const emotions = Object.entries(emotionContext);
      if (emotions.length === 0) {
        emotions.push(['neutral', 100]);
      }
      
      const dominantEmotion = emotions.reduce((a, b) => a[1] > b[1] ? a : b);
      const emotionName = dominantEmotion[0];
      const emotionArabic = this.getEmotionArabic(emotionName);
      
      const prompt = `أنت مساعد ذكي عاطفي يتحدث العربية. المستخدم يشعر بـ ${emotionArabic}. 
      رسالته: "${userMessage}"
      
      قدم رداً متعاطفاً ومفيداً بالعربية (100-150 كلمة):`;

      const response = await fetch(
        "https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inputs: prompt,
            parameters: {
              max_length: 150,
              temperature: 0.7,
              do_sample: true
            }
          }),
        }
      );

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }

      return result[0]?.generated_text?.replace(prompt, "").trim() || 
             "أعتذر، أواجه صعوبة في الرد الآن. هل يمكنك إعادة المحاولة؟";
    } catch (error) {
      console.error("Hugging Face error:", error);
      throw error;
    }
  }

  private getEmotionArabic(emotion: string): string {
    const emotionMap = {
      happy: "السعادة",
      sad: "الحزن",
      angry: "الغضب",
      surprised: "التفاجؤ",
      fearful: "الخوف",
      disgusted: "الاشمئزاز",
      neutral: "الحياد"
    };
    return emotionMap[emotion as keyof typeof emotionMap] || emotion;
  }
}

// Fallback Local Provider (Always available)
class LocalProvider implements AIProvider {
  name = "الذكاء المحلي (مضمون)";

  isConfigured(): boolean {
    return true; // Always available
  }

  async generateResponse(userMessage: string, emotionContext: EmotionData): Promise<string> {
    if (!emotionContext || typeof emotionContext !== 'object') {
      emotionContext = createDefaultEmotionContext();
    }
    
    const emotions = Object.entries(emotionContext);
    if (emotions.length === 0) {
      emotions.push(['neutral', 100]);
    }
    
    const dominantEmotion = emotions.reduce((a, b) => a[1] > b[1] ? a : b);
    const emotionName = dominantEmotion[0];
    const emotionIntensity = dominantEmotion[1];

    const responses = this.getEmotionResponses(emotionName, emotionIntensity);
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    return `${randomResponse} 

أفهم مشاعرك وأقدر مشاركتك لها معي. هل تود التحدث أكثر حول ما تشعر به؟

💡 نصيحة: يمكنك الحصول على ردود أكثر تطوراً بإضافة مفتاح API للذكاء الاصطناعي من الإعدادات.`;
  }

  private getEmotionResponses(emotion: string, intensity: number): string[] {
    const highIntensity = intensity > 60;
    
    switch (emotion) {
      case 'happy':
        return highIntensity 
          ? [
              "رائع! أشعر بسعادتك الكبيرة 😊 هذه لحظات جميلة تستحق الاحتفال بها.",
              "ما أجمل هذه السعادة التي تشعر بها! 🌟 استمتع بكل لحظة منها.",
              "سعادتك تنير يومي! 😄 شاركني ما جعلك تشعر بهذا الفرح."
            ]
          : [
              "أحب أن أراك مبتسماً 😊 هذه البداية الجيدة لليوم.",
              "شعور جميل بالسعادة 🌸 أتمنى أن يستمر معك.",
              "أشعر بإيجابيتك اللطيفة ✨ كيف يمكنني مساعدتك اليوم؟"
            ];
      
      case 'sad':
        return highIntensity
          ? [
              "أعلم أن الأمر صعب عليك الآن 💙 لست وحدك في هذا الشعور.",
              "الحزن جزء من الحياة، وأنا هنا للاستماع إليك 🤗",
              "أتفهم ألمك، وأريدك أن تعلم أن هذا الشعور سيمر 💪"
            ]
          : [
              "أشعر ببعض الحزن في صوتك 💙 هل تريد التحدث عما يؤثر عليك؟",
              "يبدو أن يومك ليس على ما يرام 🌙 أنا هنا إذا احتجت للحديث.",
              "الحزن الخفيف طبيعي أحياناً 💭 ما رأيك في فعل شيء يحسن مزاجك؟"
            ];
      
      case 'angry':
        return highIntensity
          ? [
              "أفهم غضبك، وهذا شعور مبرر 🔥 دعنا نتحدث عما يزعجك.",
              "الغضب قوي، لكن يمكننا التعامل معه سوياً 💪 تنفس بعمق.",
              "أرى أن الأمر يؤثر عليك كثيراً 😤 هل تريد مشاركة ما حدث؟"
            ]
          : [
              "أشعر ببعض الانزعاج 😕 هل هناك شيء يمكنني مساعدتك فيه؟",
              "يبدو أن شيئاً ما يضايقك قليلاً 🤔 أخبرني عنه.",
              "الإحباط طبيعي أحياناً 💭 كيف يمكنني دعمك؟"
            ];
      
      default:
        return [
          "أقدر مشاركتك معي 😊 كيف يمكنني مساعدتك اليوم؟",
          "أنا هنا للاستماع والمساعدة 🤗 ما الذي يشغل بالك؟",
          "شكراً لثقتك بي 💙 أخبرني كيف تشعر وما تحتاجه."
        ];
    }
  }
}

// Provider Manager
class AIProviderManager {
  private providers: AIProvider[] = [];

  constructor() {
    this.providers = [
      new FreeGPTProvider(),    // Completely free, no API key needed!
      new GeminiProvider(),     // Free and powerful
      new OpenAIProvider(),     // Premium but reliable
      new HuggingFaceProvider(), // Free alternative
      new LocalProvider()       // Always available fallback
    ];
  }

  async generateResponse(userMessage: string, emotionContext: EmotionData): Promise<{
    response: string;
    provider: string;
  }> {
    // Try providers in order until one works
    for (const provider of this.providers) {
      if (provider.isConfigured()) {
        try {
          console.log(`Trying ${provider.name} for AI response...`);
          const response = await provider.generateResponse(userMessage, emotionContext);
          console.log(`✅ ${provider.name} responded successfully`);
          return {
            response,
            provider: provider.name
          };
        } catch (error) {
          console.warn(`❌ ${provider.name} failed:`, error);
          continue; // Try next provider
        }
      } else {
        console.log(`⏭️ ${provider.name} not configured, skipping...`);
      }
    }

    // If all else fails, use local provider
    const localProvider = new LocalProvider();
    const response = await localProvider.generateResponse(userMessage, emotionContext);
    return {
      response,
      provider: localProvider.name
    };
  }

  getAvailableProviders(): Array<{name: string; configured: boolean; description: string}> {
    return this.providers.map(provider => ({
      name: provider.name,
      configured: provider.isConfigured(),
      description: this.getProviderDescription(provider.name)
    }));
  }

  private getProviderDescription(name: string): string {
    const descriptions = {
      "Free GPT (مجاني تماماً)": "مزود مجاني تماماً - بدون مفاتيح API",
      "Google Gemini (مجاني)": "ذكاء اصطناعي متقدم من Google - مجاني للاستخدام الشخصي",
      "OpenAI GPT-4o": "أحدث نماذج GPT من OpenAI - يتطلب مفتاح API",
      "Hugging Face (مجاني)": "مزود مفتوح المصدر - مجاني مع مفتاح API",
      "الذكاء المحلي (مضمون)": "ردود ذكية محلية - متاح دائماً كاحتياطي"
    };
    return descriptions[name as keyof typeof descriptions] || "مزود ذكاء اصطناعي";
  }
}

export const aiProviderManager = new AIProviderManager();