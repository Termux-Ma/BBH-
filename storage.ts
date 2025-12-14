import { type User, type InsertUser, type ScrapedCode, type InsertScrapedCode } from "@shared/schema";
import { randomUUID } from "crypto";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllScrapedCodes(): Promise<ScrapedCode[]>;
  getScrapedCode(id: string): Promise<ScrapedCode | undefined>;
  createScrapedCode(code: InsertScrapedCode): Promise<ScrapedCode>;
  updateScrapedCodeHostedUrl(id: string, hostedUrl: string): Promise<ScrapedCode | undefined>;
  deleteScrapedCode(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private scrapedCodes: Map<string, ScrapedCode>;

  constructor() {
    this.users = new Map();
    this.scrapedCodes = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getAllScrapedCodes(): Promise<ScrapedCode[]> {
    return Array.from(this.scrapedCodes.values()).sort(
      (a, b) => {
        const aTime = new Date(a.createdAt || 0).getTime();
        const bTime = new Date(b.createdAt || 0).getTime();
        return bTime - aTime;
      }
    );
  }

  async getScrapedCode(id: string): Promise<ScrapedCode | undefined> {
    return this.scrapedCodes.get(id);
  }

  async createScrapedCode(insertCode: InsertScrapedCode): Promise<ScrapedCode> {
    const id = randomUUID();
    const code: ScrapedCode = {
      ...insertCode,
      id,
      sourceLanguage: insertCode.sourceLanguage || "html",
      hostedUrl: null,
      createdAt: new Date() as any,
    };
    this.scrapedCodes.set(id, code);
    return code;
  }

  async updateScrapedCodeHostedUrl(id: string, hostedUrl: string): Promise<ScrapedCode | undefined> {
    const code = this.scrapedCodes.get(id);
    if (!code) return undefined;
    const updated = { ...code, hostedUrl };
    this.scrapedCodes.set(id, updated);
    return updated;
  }

  async deleteScrapedCode(id: string): Promise<boolean> {
    this.scrapedCodes.delete(id);
    return true;
  }
}

export const storage = new MemStorage();
