import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email"),
  age: integer("age"),
  gender: text("gender"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  startTime: timestamp("start_time").defaultNow(),
  endTime: timestamp("end_time"),
  isActive: boolean("is_active").default(true),
});

export const emotionAnalyses = pgTable("emotion_analyses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").references(() => sessions.id),
  timestamp: timestamp("timestamp").defaultNow(),
  emotions: jsonb("emotions").notNull(), // { happy, sad, angry, surprised, fearful, disgusted, neutral }
  age: integer("age"),
  gender: text("gender"),
  confidence: integer("confidence"), // percentage
});

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").references(() => sessions.id),
  isUser: boolean("is_user").notNull(),
  content: text("content").notNull(),
  emotionContext: jsonb("emotion_context"), // emotion data at time of message
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  name: true,
  email: true,
  age: true,
  gender: true,
});

export const insertSessionSchema = createInsertSchema(sessions).pick({
  userId: true,
});

export const insertEmotionAnalysisSchema = createInsertSchema(emotionAnalyses).pick({
  sessionId: true,
  emotions: true,
  age: true,
  gender: true,
  confidence: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).pick({
  sessionId: true,
  isUser: true,
  content: true,
  emotionContext: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessions.$inferSelect;

export type InsertEmotionAnalysis = z.infer<typeof insertEmotionAnalysisSchema>;
export type EmotionAnalysis = typeof emotionAnalyses.$inferSelect;

export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;

export type EmotionData = {
  happy: number;
  sad: number;
  angry: number;
  surprised: number;
  fearful: number;
  disgusted: number;
  neutral: number;
};
