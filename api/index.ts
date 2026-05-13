import express from "express";
import cors from "cors";

// This file is used specifically for Vercel Serverless Functions.
// It exposes the API endpoints without starting a long-running HTTP server.

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/debug-env", (req, res) => {
  res.json({
    hasFirebaseKey: !!process.env.VITE_FIREBASE_API_KEY,
    nodeEnv: process.env.NODE_ENV,
    viteKey: process.env.VITE_FIREBASE_API_KEY ? "EXISTS" : "MISSING"
  });
});

app.post("/api/debug-log", (req, res) => {
  console.log("CLIENT DEBUG LOG:", req.body);
  res.sendStatus(200);
});

export default app;
