import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Health check API
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      service: "Uganda Coffee Traceability & Export Readiness API",
      timestamp: new Date().toISOString()
    });
  });

  // Regulatory disclosure endpoint
  app.get("/api/regulatory-notice", (_req, res) => {
    res.json({
      productPositioning: "Software operating layer for Ugandan coffee supply-chain traceability, due-diligence data organization, and export readiness calculation.",
      disclaimer: "This software is an evidence organization tool and does not guarantee legal EUDR or statutory certification."
    });
  });

  // Vite middleware for development
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
    console.log(`[Uganda Coffee Traceability OS] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
