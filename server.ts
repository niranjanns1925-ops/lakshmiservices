import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import cors from "cors";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Cashfree Order Creation API
  app.post("/api/create-cashfree-order", async (req, res) => {
    try {
      const { orderAmount, customerId, customerName, customerEmail, customerPhone } = req.body;
      const orderId = `order_${Date.now()}`;

      // Keys should be added to the Secrets in AI Studio and accessed via processing.env
      const appId = process.env.CASHFREE_APP_ID;
      const secretKey = process.env.CASHFREE_SECRET_KEY;
      const environment = process.env.CASHFREE_ENVIRONMENT || 'SANDBOX'; // 'SANDBOX' or 'PRODUCTION'

      if (!appId || !secretKey) {
        return res.status(500).json({ error: "Cashfree API keys are not configured on the server." });
      }

      const url = environment === 'PRODUCTION' 
        ? 'https://api.cashfree.com/pg/orders' 
        : 'https://sandbox.cashfree.com/pg/orders';

      const payload = {
        order_amount: orderAmount,
        order_currency: 'INR',
        order_id: orderId,
        customer_details: {
          customer_id: customerId,
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone || "9999999999"
        },
        order_meta: {
          return_url: `${req.protocol}://${req.get('host')}/dashboard?order_id={order_id}`
        }
      };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-version": "2023-08-01",
          "x-client-id": appId,
          "x-client-secret": secretKey
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Cashfree API error:", data);
        return res.status(response.status).json({ error: data.message || "Error creating Cashfree order." });
      }

      res.json({
        payment_session_id: data.payment_session_id,
        order_id: data.order_id
      });
    } catch (error: any) {
      console.error("Server error creating Cashfree order:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
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
