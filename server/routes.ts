import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertSessionSchema, 
  insertEmotionAnalysisSchema,
  insertChatMessageSchema,
  type EmotionData
} from "@shared/schema";
import OpenAI from "openai";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY || "default_key"
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Create or get user
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByName(userData.name);
      if (existingUser) {
        return res.json(existingUser);
      }
      
      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: "Invalid user data" });
    }
  });

  // Create session
  app.post("/api/sessions", async (req, res) => {
    try {
      const sessionData = insertSessionSchema.parse(req.body);
      
      // End any existing active session for this user
      const existingSession = await storage.getActiveSessionByUserId(sessionData.userId!);
      if (existingSession) {
        await storage.updateSession(existingSession.id, { 
          isActive: false, 
          endTime: new Date() 
        });
      }
      
      const session = await storage.createSession(sessionData);
      res.json(session);
    } catch (error) {
      res.status(400).json({ error: "Invalid session data" });
    }
  });

  // Get session
  app.get("/api/sessions/:id", async (req, res) => {
    const session = await storage.getSession(req.params.id);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }
    res.json(session);
  });

  // Save emotion analysis
  app.post("/api/emotions", async (req, res) => {
    try {
      const emotionData = insertEmotionAnalysisSchema.parse(req.body);
      const analysis = await storage.createEmotionAnalysis(emotionData);
      res.json(analysis);
    } catch (error) {
      res.status(400).json({ error: "Invalid emotion data" });
    }
  });

  // Get emotion analyses for session
  app.get("/api/sessions/:sessionId/emotions", async (req, res) => {
    const analyses = await storage.getEmotionAnalysesBySession(req.params.sessionId);
    res.json(analyses);
  });

  // Send chat message with AI response
  app.post("/api/chat", async (req, res) => {
    try {
      const messageData = insertChatMessageSchema.parse(req.body);
      
      // Save user message
      const userMessage = await storage.createChatMessage(messageData);
      
      // Generate AI response with emotional context
      const emotionContext = messageData.emotionContext as EmotionData;
      const aiResponse = await generateEmpatheticResponse(messageData.content, emotionContext);
      
      // Save AI response
      const aiMessage = await storage.createChatMessage({
        sessionId: messageData.sessionId,
        isUser: false,
        content: aiResponse,
        emotionContext: emotionContext
      });
      
      res.json({ userMessage, aiMessage });
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ error: "Failed to process chat message" });
    }
  });

  // Get chat messages for session
  app.get("/api/sessions/:sessionId/messages", async (req, res) => {
    const messages = await storage.getChatMessagesBySession(req.params.sessionId);
    res.json(messages);
  });

  // Get session statistics
  app.get("/api/sessions/:sessionId/stats", async (req, res) => {
    const sessionId = req.params.sessionId;
    const emotions = await storage.getEmotionAnalysesBySession(sessionId);
    const messages = await storage.getChatMessagesBySession(sessionId);
    const session = await storage.getSession(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    // Calculate statistics
    const totalDetections = emotions.length;
    const averageConfidence = emotions.length > 0 
      ? Math.round(emotions.reduce((sum, e) => sum + (e.confidence || 0), 0) / emotions.length)
      : 0;
    
    // Calculate dominant emotion
    const emotionTotals: Record<string, number> = {};
    emotions.forEach(analysis => {
      const emotions = analysis.emotions as EmotionData;
      Object.entries(emotions).forEach(([emotion, value]) => {
        emotionTotals[emotion] = (emotionTotals[emotion] || 0) + value;
      });
    });
    
    const dominantEmotion = Object.entries(emotionTotals).length > 0
      ? Object.entries(emotionTotals).reduce((a, b) => a[1] > b[1] ? a : b)[0]
      : 'neutral';

    // Calculate session duration
    const duration = session.isActive && session.startTime
      ? Math.floor((Date.now() - session.startTime.getTime()) / 1000)
      : session.endTime && session.startTime
      ? Math.floor((session.endTime.getTime() - session.startTime.getTime()) / 1000)
      : 0;

    res.json({
      duration,
      detections: totalDetections,
      averageConfidence,
      dominantEmotion,
      messageCount: messages.length,
      latestEmotions: emotions.slice(-1)[0]?.emotions || null
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}

async function generateEmpatheticResponse(userMessage: string, emotionContext: EmotionData): Promise<string> {
  try {
    const dominantEmotion = Object.entries(emotionContext).reduce((a, b) => a[1] > b[1] ? a : b);
    const emotionName = dominantEmotion[0];
    const emotionIntensity = dominantEmotion[1];

    const emotionPrompt = getEmotionPrompt(emotionName, emotionIntensity);

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
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
        {
          role: "user", 
          content: userMessage
        }
      ],
      max_tokens: 200,
      temperature: 0.7
    });

    return response.choices[0].message.content || "أعتذر، لم أتمكن من فهم رسالتك. هل يمكنك إعادة صياغتها؟";
  } catch (error) {
    console.error("OpenAI error:", error);
    return "أعتذر، واجهت مشكلة في الاستجابة. يرجى المحاولة مرة أخرى.";
  }
}

function getEmotionPrompt(emotion: string, intensity: number): string {
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
