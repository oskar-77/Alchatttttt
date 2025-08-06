import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";
import type { EmotionData } from "@shared/schema";

// AI Provider interface
interface AIProvider {
  name: string;
  generateResponse(userMessage: string, emotionContext: EmotionData): Promise<string>;
  isConfigured(): boolean;
}

// OpenAI Provider
class OpenAIProvider implements AIProvider {
  name = "OpenAI GPT-4o";
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY || ""
    });
  }

  isConfigured(): boolean {
    return !!process.env.OPENAI_API_KEY;
  }

  async generateResponse(userMessage: string, emotionContext: EmotionData): Promise<string> {
    try {
      const dominantEmotion = Object.entries(emotionContext).reduce((a, b) => a[1] > b[1] ? a : b);
      const emotionName = dominantEmotion[0];
      const emotionIntensity = dominantEmotion[1];
      const emotionPrompt = this.getEmotionPrompt(emotionName, emotionIntensity);

      const response = await this.client.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `أنت مساعد ذكي عاطفي يتحدث العربية ويتفهم مشاعر المستخدمين. ${emotionPrompt}
            
            قواعد مهمة:
            - اكتب بالعربية فقط
            - كن متعاطفاً ومتفهماً
            - قدم نصائح عملية ومفيدة
            - اجعل ردودك قصيرة ومركزة (100-150 كلمة)
            - استخدم الإيموجي بشكل مناسب
            - تجنب النصائح الطبية المباشرة`
          },
          { role: "user", content: userMessage }
        ],
        max_tokens: 200,
        temperature: 0.7
      });

      return response.choices[0].message.content || "أعتذر، لم أتمكن من فهم رسالتك.";
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
      case 'fearful':
        return "المستخدم يشعر بالخوف أو القلق. طمئنه وقدم نصائح للتغلب على المخاوف.";
      case 'surprised':
        return "المستخدم متفاجئ. ساعده على معالجة المعلومات الجديدة أو الموقف.";
      case 'disgusted':
        return "المستخدم يشعر بالاشمئزاز أو عدم الرضا. ساعده على التعامل مع هذه المشاعر.";
      default:
        return "المستخدم في حالة محايدة. كن ودوداً ومفيداً في تفاعلك معه.";
    }
  }
}

// Google Gemini Provider (FREE!)
class GeminiProvider implements AIProvider {
  name = "Google Gemini (مجاني)";
  private client: GoogleGenAI;

  constructor() {
    this.client = new GoogleGenAI({ 
      apiKey: process.env.GEMINI_API_KEY || ""
    });
  }

  isConfigured(): boolean {
    return !!process.env.GEMINI_API_KEY;
  }

  async generateResponse(userMessage: string, emotionContext: EmotionData): Promise<string> {
    try {
      const dominantEmotion = Object.entries(emotionContext).reduce((a, b) => a[1] > b[1] ? a : b);
      const emotionName = dominantEmotion[0];
      const emotionIntensity = dominantEmotion[1];
      const emotionPrompt = this.getEmotionPrompt(emotionName, emotionIntensity);

      const response = await this.client.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [{
              text: `أنت مساعد ذكي عاطفي يتحدث العربية. ${emotionPrompt}
              
              رسالة المستخدم: "${userMessage}"
              
              رد عليه بشكل متعاطف ومفيد بالعربية (100-150 كلمة).`
            }]
          }
        ]
      });

      return response.text || "أعتذر، لم أتمكن من فهم رسالتك.";
    } catch (error) {
      console.error("Gemini error:", error);
      throw error;
    }
  }

  private getEmotionPrompt(emotion: string, intensity: number): string {
    const highIntensity = intensity > 60;
    const emotionMap = {
      happy: highIntensity ? "سعادة كبيرة" : "سعادة خفيفة",
      sad: highIntensity ? "حزن شديد" : "حزن خفيف", 
      angry: highIntensity ? "غضب شديد" : "انزعاج خفيف",
      fearful: "خوف وقلق",
      surprised: "تفاجؤ",
      disgusted: "اشمئزاز",
      neutral: "حالة طبيعية"
    };
    
    return `المستخدم يشعر بـ ${emotionMap[emotion as keyof typeof emotionMap] || "مشاعر متنوعة"}.`;
  }
}

// Free Hugging Face Provider
class HuggingFaceProvider implements AIProvider {
  name = "Hugging Face (مجاني)";
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.HUGGINGFACE_API_KEY || "";
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async generateResponse(userMessage: string, emotionContext: EmotionData): Promise<string> {
    try {
      const dominantEmotion = Object.entries(emotionContext).reduce((a, b) => a[1] > b[1] ? a : b);
      const emotionName = dominantEmotion[0];
      
      const prompt = `أنت مساعد ذكي عاطفي. المستخدم يشعر بـ ${this.getEmotionArabic(emotionName)}. 
      رسالته: "${userMessage}"
      رد عليه بالعربية بشكل متعاطف:`;

      const response = await fetch(
        "https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium",
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          method: "POST",
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
    const dominantEmotion = Object.entries(emotionContext).reduce((a, b) => a[1] > b[1] ? a : b);
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
      new GeminiProvider(),     // Free and powerful - highest priority
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

  getAvailableProviders(): Array<{name: string; configured: boolean}> {
    return this.providers.map(provider => ({
      name: provider.name,
      configured: provider.isConfigured()
    }));
  }
}

export const aiProviderManager = new AIProviderManager();