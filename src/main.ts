import express, { Request, Response } from "express";
import puppeteer, { Browser } from "puppeteer";
import { login } from "./login.js";
import { transactions } from "./transactions.js";
import { status } from "./status.js";
import { otpEmitter } from "./emitter.js";
import { delete_cookie } from "./cookie.js";

const app = express();
app.use(express.json());

// Global browser instance that stays open
let browser: Browser | null = null;

// Initialize browser on startup
async function initBrowser(): Promise<Browser> {
  if (!browser || !browser.connected) {
    console.log("Launching browser...");
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    console.log("Browser launched successfully");
  }
  return browser;
}

// Get browser status
app.get("/health", (req: Request, res: Response) => {
  res.json({
    success: true,
    browser_connected: browser?.connected ?? false,
    time: Date.now(),
  });
});

// Login endpoint
app.post("/login", async (req: Request, res: Response) => {
  const { store_id, phone, password } = req.body;

  if (!store_id || !phone || !password) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields: store_id, phone, password",
    });
  }

  try {
    await login(store_id, phone, password);
    res.json({
      success: true,
      message: "Login process initiated, waiting for OTP",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// OTP endpoint - receives OTP and emits to login process
app.post("/otp", (req: Request, res: Response) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({
      success: false,
      message: "Missing OTP code",
    });
  }

  console.log(`OTP received: ${code}`);
  otpEmitter.emit("otp", code);

  res.json({
    success: true,
    message: "OTP received and forwarded",
  });
});

// Get transactions
app.get("/transactions/:store_id", async (req: Request, res: Response) => {
  try {
    const store_id = req.params.store_id as string;
    const browserInstance = await initBrowser();
    const result = await transactions(browserInstance, store_id);
    res.status(result.status).json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get account status
app.get("/status/:store_id", async (req: Request, res: Response) => {
  try {
    const store_id = req.params.store_id as string;
    const browserInstance = await initBrowser();
    const result = await status(browserInstance, store_id);
    res.status(result.status).json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Disconnect - delete store cookie
app.delete("/disconnect/:store_id", async (req: Request, res: Response) => {
  try {
    const store_id = req.params.store_id as string;
    const deleted = await delete_cookie(store_id);

    if (deleted) {
      res.json({
        success: true,
        message: `Store ${store_id} disconnected successfully`,
        time: Date.now(),
      });
    } else {
      res.status(404).json({
        success: false,
        message: `Store ${store_id} not found or already disconnected`,
        time: Date.now(),
      });
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

const PORT = process.env.PORT || 3000;

// Main startup function
async function main() {
  try {
    // Initialize browser on startup
    await initBrowser();

    // Start Express server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log("Available endpoints:");
      console.log(
        "  GET    /health              - Check server and browser status",
      );
      console.log("  POST   /login               - Login to Wave account");
      console.log("  POST   /otp                 - Submit OTP code");
      console.log("  GET    /transactions/:store_id - Get transaction history");
      console.log("  GET    /status/:store_id    - Get account status");
      console.log("  DELETE /disconnect/:store_id - Disconnect store account");
    });

    // Handle graceful shutdown
    process.on("SIGINT", async () => {
      console.log("\nShutting down...");
      if (browser) {
        await browser.close();
        console.log("Browser closed");
      }
      process.exit(0);
    });

    process.on("SIGTERM", async () => {
      console.log("\nShutting down...");
      if (browser) {
        await browser.close();
        console.log("Browser closed");
      }
      process.exit(0);
    });
  } catch (error: any) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

// Run the main function
main();
