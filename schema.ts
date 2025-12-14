import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const scrapedCodeTable = pgTable("scraped_code", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  url: text("url").notNull(),
  sourceLanguage: text("source_language").notNull().default("html"),
  code: text("code").notNull(),
  fileName: text("file_name"),
  hostedUrl: text("hosted_url"),
  title: text("title"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertScrapedCodeSchema = createInsertSchema(
  scrapedCodeTable,
).omit({
  id: true,
  createdAt: true,
  hostedUrl: true,
});

export type InsertScrapedCode = z.infer<typeof insertScrapedCodeSchema>;
export type ScrapedCode = typeof scrapedCodeTable.$inferSelect;
