import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import fs from "fs";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: "50mb" }));

  const uploadDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  app.use('/uploads', express.static(uploadDir));

  app.post("/api/upload", (req, res) => {
    try {
      const { fileName, base64 } = req.body;
      const base64Data = base64.replace(/^data:.*?;base64,/, "");
      const ext = fileName.split('.').pop();
      const safeName = `file_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
      
      fs.writeFileSync(path.join(uploadDir, safeName), base64Data, 'base64');
      res.json({ url: `/uploads/${safeName}` });
    } catch (e: any) {
      console.error("Upload error:", e);
      res.status(500).json({ error: String(e.message || e) });
    }
  });

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
}

startServer();
