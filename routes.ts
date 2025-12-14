import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertScrapedCodeSchema } from "@shared/schema";
import { load } from "cheerio";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Scrape code from URL
  app.post("/api/scrape", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }

      const response = await fetch(url);
      const html = await response.text();
      const $ = load(html);

      const extractedCodes = [];

      // Extract HTML
      const htmlContent = $.html();
      extractedCodes.push({
        url,
        sourceLanguage: "html",
        code: htmlContent,
        fileName: "index.html",
        title: $("title").text() || "Untitled",
      });

      // Extract CSS
      $("style").each((i, el) => {
        const css = $(el).html();
        if (css) {
          extractedCodes.push({
            url,
            sourceLanguage: "css",
            code: css,
            fileName: `style-${i}.css`,
            title: $("title").text() || "Untitled",
          });
        }
      });

      // Extract JavaScript
      $("script").each((i, el) => {
        const js = $(el).html();
        if (js && !$(el).attr("src")) {
          extractedCodes.push({
            url,
            sourceLanguage: "javascript",
            code: js,
            fileName: `script-${i}.js`,
            title: $("title").text() || "Untitled",
          });
        }
      });

      // Save to database
      const savedCodes = [];
      for (const code of extractedCodes) {
        const validated = insertScrapedCodeSchema.safeParse(code);
        if (validated.success) {
          const saved = await storage.createScrapedCode(validated.data);
          savedCodes.push(saved);
        }
      }

      res.json({ success: true, codes: savedCodes });
    } catch (error) {
      console.error("Scrape error:", error);
      res.status(500).json({ error: "Failed to scrape URL" });
    }
  });

  // Get all scraped codes
  app.get("/api/codes", async (req, res) => {
    try {
      const codes = await storage.getAllScrapedCodes();
      res.json(codes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch codes" });
    }
  });

  // Get specific code
  app.get("/api/codes/:id", async (req, res) => {
    try {
      const code = await storage.getScrapedCode(req.params.id);
      if (!code) {
        return res.status(404).json({ error: "Code not found" });
      }
      res.json(code);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch code" });
    }
  });

  // Host code (generate shareable link)
  app.post("/api/codes/:id/host", async (req, res) => {
    try {
      const hostedUrl = `${process.env.REPLIT_DOMAIN || "http://localhost:5000"}/hosted/${req.params.id}`;
      const updated = await storage.updateScrapedCodeHostedUrl(
        req.params.id,
        hostedUrl
      );
      if (!updated) {
        return res.status(404).json({ error: "Code not found" });
      }
      res.json({ hostedUrl });
    } catch (error) {
      res.status(500).json({ error: "Failed to host code" });
    }
  });

  // Delete code
  app.delete("/api/codes/:id", async (req, res) => {
    try {
      await storage.deleteScrapedCode(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete code" });
    }
  });

  // Serve hosted code
  app.get("/hosted/:id", async (req, res) => {
    try {
      const code = await storage.getScrapedCode(req.params.id);
      if (!code) {
        return res.status(404).send("Code not found");
      }

      const contentTypes: Record<string, string> = {
        html: "text/html",
        css: "text/css",
        javascript: "application/javascript",
        python: "text/plain",
        java: "text/plain",
        json: "application/json",
      };

      res.set("Content-Type", contentTypes[code.sourceLanguage] || "text/plain");
      res.send(code.code);
    } catch (error) {
      res.status(500).send("Error serving code");
    }
  });

  return httpServer;
}
