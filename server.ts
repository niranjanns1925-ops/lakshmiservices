import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import fs from "fs";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  app.post("/api/create-cashfree-order", async (req, res) => {
    try {
      const { orderAmount, customerId, customerName, customerEmail, customerPhone } = req.body;
      
      const APP_ID = process.env.CASHFREE_APP_ID;
      const SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
      const ENV = process.env.CASHFREE_ENVIRONMENT || 'SANDBOX';
      
      if (!APP_ID || !SECRET_KEY) {
         return res.status(500).json({ error: "Cashfree credentials are not configured on the server." });
      }

      const baseUrl = ENV === 'PRODUCTION' 
        ? 'https://api.cashfree.com/pg/orders'
        : 'https://sandbox.cashfree.com/pg/orders';

      const response = await fetch(baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-version": "2023-08-01",
          "x-client-id": APP_ID,
          "x-client-secret": SECRET_KEY
        },
        body: JSON.stringify({
          order_amount: orderAmount,
          order_currency: "INR",
          customer_details: {
            customer_id: customerId || `cust_${Date.now()}`,
            customer_name: customerName || "Customer",
            customer_email: customerEmail || "test@example.com",
            customer_phone: customerPhone || "9999999999"
          },
          order_meta: {
            return_url: `${req.headers.origin || 'http://localhost:3000'}/dashboard`
          }
        })
      });

      const data = await response.json();

      if (!response.ok) {
         console.error("Cashfree order creation failed:", data);
         return res.status(response.status).json({ error: data.message || "Failed to create order." });
      }

      res.json({ ...data, environment: ENV });
    } catch (err: any) {
      console.error("Internal Cashfree integration error:", err);
      res.status(500).json({ error: "Internal server error." });
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
