import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import fs from "fs";
import multer from "multer";

import os from "os";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Local file upload configuration
  const uploadDir = path.join(os.tmpdir(), "uploads");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const storageConfig = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
      // Safe filename
      const originalName = file.originalname || "unknown";
      const safeName = originalName.replace(/[^a-zA-Z0-9.\-_]/g, "");
      cb(null, `${Date.now()}-${safeName}`);
    }
  });

  const upload = multer({ 
    storage: storageConfig,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
  });

  app.post("/api/upload", (req, res, next) => {
    try {
      upload.single("file")(req, res, (err) => {
        if (err instanceof multer.MulterError) {
          return res.status(400).json({ error: err.message });
        } else if (err) {
          return res.status(500).json({ error: err.message || "Unknown upload error" });
        }
        
        if (!req.file) {
          return res.status(400).json({ error: "No file uploaded" });
        }
        
        const fileUrl = `/uploads/${req.file.filename}`;
        res.json({ url: fileUrl });
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Upload controller crashed" });
    }
  });

  // Serve the uploads directory statically
  app.use("/uploads", express.static(uploadDir));


  app.get("/api/debug-env", (req, res) => {
    res.json({
      hasFirebaseKey: !!process.env.VITE_FIREBASE_API_KEY,
      nodeEnv: process.env.NODE_ENV,
      viteKey: process.env.VITE_FIREBASE_API_KEY ? "EXISTS" : "MISSING"
    });
  });

  app.post("/api/debug-log", (req, res) => {
    require('fs').writeFileSync('./client-debug.json', JSON.stringify(req.body, null, 2));
    console.log("CLIENT DEBUG LOG:", req.body);
    res.sendStatus(200);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production static file serving
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // Global error handler to enforce JSON responses
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Global Express Error:", err);
    if (!res.headersSent) {
      // If it's a multer payload too large or express body parser error
      const status = err.status || err.statusCode || 500;
      res.status(status).json({ error: err.message || "Internal Server Error" });
    }
  });
}

startServer();
