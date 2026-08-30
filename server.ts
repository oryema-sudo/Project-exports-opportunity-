import express, { Request, Response, NextFunction } from "express";
import path from "path";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { v4 as uuidv4 } from "uuid";
import { apiRouter } from "./src/server/apiRouter.ts";
import { seedOrganizationData } from "./src/server/seedDatabase.ts";
import { requireAuth, AuthRequest } from "./src/middleware/auth.ts";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Request ID & Structured Logging Middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    const reqId = (req.headers["x-request-id"] as string) || uuidv4();
    res.setHeader("X-Request-ID", reqId);
    (req as any).id = reqId;
    next();
  });

  // Security Headers (Helmet) with iframe support
  app.use(
    helmet({
      contentSecurityPolicy: false, // Vite and Leaflet require flexible script/style evaluation
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" }
    })
  );

  // Secure CORS
  app.use(
    cors({
      origin: true,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID"]
    })
  );

  // Controlled Body Parsers
  app.use(express.json({ limit: "25mb" }));
  app.use(express.urlencoded({ extended: true, limit: "25mb" }));

  // General Rate Limiter (Protects against DoS on Cloud Run)
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1200, // max 1200 requests per IP per window
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later." }
  });
  app.use("/api/", generalLimiter);

  // Stricter Rate Limiter for Onboarding and Auth mutations
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many authentication or onboarding requests, please try again in 15 minutes." }
  });
  app.use("/api/auth/", authLimiter);
  app.use("/api/invitations", authLimiter);

  // File Upload & Bulk Processing Limiter
  const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "File upload rate limit reached, please try again in 15 minutes." }
  });
  app.use("/api/documents/upload", uploadLimiter);
  app.use("/api/import/csv", uploadLimiter);

  // Health and Liveness Endpoint
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "healthy",
      service: "Uganda Coffee Traceability & Export Readiness API",
      environment: process.env.NODE_ENV || "development",
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString()
    });
  });

  // Regulatory disclosure endpoint
  app.get("/api/regulatory-notice", (_req, res) => {
    res.json({
      productPositioning: "Software operating layer for Ugandan coffee supply-chain traceability, due-diligence data organization, and export readiness calculation.",
      disclaimer: "This software is an evidence organization tool and does not guarantee legal EUDR or statutory certification.",
      ruleVersion: "v1.2.0-uganda-2026"
    });
  });

  // Seed endpoint for new organization pilot baseline
  app.post("/api/seed", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const orgId = req.user!.organizationId;
      const result = await seedOrganizationData(orgId, req.user!.name);
      res.json(result);
    } catch (err: any) {
      console.error("[Seed API] Failed to seed baseline:", err);
      res.status(500).json({ error: "Failed to initialize organization baseline" });
    }
  });

  // Mount Hardened REST API
  app.use("/api", apiRouter);

  // Centralized Error Handling Middleware
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    console.error(`[API Error] [${(req as any).id || "unknown"}]`, err);
    res.status(err.status || 500).json({
      error: err.message || "An unexpected server error occurred",
      requestId: (req as any).id
    });
  });

  // Vite middleware for development vs static build for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Uganda Coffee Traceability OS] Production-ready server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
