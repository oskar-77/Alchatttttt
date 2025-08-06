import { 
  type User, 
  type InsertUser,
  type Session,
  type InsertSession,
  type EmotionAnalysis,
  type InsertEmotionAnalysis,
  type ChatMessage,
  type InsertChatMessage
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByName(name: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Sessions
  getSession(id: string): Promise<Session | undefined>;
  createSession(session: InsertSession): Promise<Session>;
  updateSession(id: string, updates: Partial<Session>): Promise<Session | undefined>;
  getActiveSessionByUserId(userId: string): Promise<Session | undefined>;
  
  // Emotion Analyses
  createEmotionAnalysis(analysis: InsertEmotionAnalysis): Promise<EmotionAnalysis>;
  getEmotionAnalysesBySession(sessionId: string): Promise<EmotionAnalysis[]>;
  
  // Chat Messages
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatMessagesBySession(sessionId: string): Promise<ChatMessage[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private sessions: Map<string, Session> = new Map();
  private emotionAnalyses: Map<string, EmotionAnalysis> = new Map();
  private chatMessages: Map<string, ChatMessage> = new Map();

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByName(name: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.name === name);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser,
      email: insertUser.email || null,
      age: insertUser.age || null,
      gender: insertUser.gender || null,
      id,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  // Sessions
  async getSession(id: string): Promise<Session | undefined> {
    return this.sessions.get(id);
  }

  async createSession(insertSession: InsertSession): Promise<Session> {
    const id = randomUUID();
    const session: Session = {
      ...insertSession,
      userId: insertSession.userId || null,
      id,
      startTime: new Date(),
      endTime: null,
      isActive: true
    };
    this.sessions.set(id, session);
    return session;
  }

  async updateSession(id: string, updates: Partial<Session>): Promise<Session | undefined> {
    const session = this.sessions.get(id);
    if (!session) return undefined;
    
    const updatedSession = { ...session, ...updates };
    this.sessions.set(id, updatedSession);
    return updatedSession;
  }

  async getActiveSessionByUserId(userId: string): Promise<Session | undefined> {
    return Array.from(this.sessions.values()).find(
      session => session.userId === userId && session.isActive
    );
  }

  // Emotion Analyses
  async createEmotionAnalysis(insertAnalysis: InsertEmotionAnalysis): Promise<EmotionAnalysis> {
    const id = randomUUID();
    const analysis: EmotionAnalysis = {
      ...insertAnalysis,
      sessionId: insertAnalysis.sessionId || null,
      age: insertAnalysis.age || null,
      gender: insertAnalysis.gender || null,
      confidence: insertAnalysis.confidence || null,
      id,
      timestamp: new Date()
    };
    this.emotionAnalyses.set(id, analysis);
    return analysis;
  }

  async getEmotionAnalysesBySession(sessionId: string): Promise<EmotionAnalysis[]> {
    return Array.from(this.emotionAnalyses.values()).filter(
      analysis => analysis.sessionId === sessionId
    );
  }

  // Chat Messages
  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = randomUUID();
    const message: ChatMessage = {
      ...insertMessage,
      sessionId: insertMessage.sessionId || null,
      emotionContext: insertMessage.emotionContext || null,
      id,
      timestamp: new Date()
    };
    this.chatMessages.set(id, message);
    return message;
  }

  async getChatMessagesBySession(sessionId: string): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values())
      .filter(message => message.sessionId === sessionId)
      .sort((a, b) => a.timestamp!.getTime() - b.timestamp!.getTime());
  }
}

export const storage = new MemStorage();
