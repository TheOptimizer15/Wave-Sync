// status.ts
import { type Browser } from "puppeteer";
import appConfig from "../app.config.json" with { type: "json" };
import { load_cookie } from "./cookie.js";

// Send webhook notification
async function sendWebhook(type: string, store_id: string, message: string) {
  try {
    await fetch(appConfig.webhook.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        store_id,
        message,
        time: Date.now(),
      }),
    });
    console.log(`Webhook sent: ${type} for store ${store_id}`);
  } catch (error: any) {
    console.log(`Failed to send webhook: ${error.message}`);
  }
}

// get page content to load if there is solde send response for to mark the account as active
export async function status(browser: Browser, store_id: string) {
  // Load cookie for this store
  const cookieData = await load_cookie(store_id);

  if (!cookieData) {
    console.log(`No config file found for store: ${store_id}`);
    if (appConfig.webhook.alert_no_config) {
      await sendWebhook(
        "no_config",
        store_id,
        "No config file found. Please connect your account.",
      );
    }
    return {
      success: false,
      message: "No config file found. Please connect your account.",
      time: Date.now(),
      status: 404,
    };
  }

  const home_page = await browser.newPage();

  try {
    // Inject the s_id cookie before navigating
    await home_page.setCookie({
      name: "s_id",
      value: cookieData.s_id,
      domain: "business.wave.com",
      path: "/",
      httpOnly: true,
      secure: true,
    });

    await home_page.goto(appConfig.wave_portal_url, {
      waitUntil: "networkidle2",
    });

    const isLoggedIn = await home_page.evaluate(() =>
      document.body.innerText.includes("SOLDE"),
    );

    if (isLoggedIn) {
      console.log("Account is active");
      await home_page.close();
      return {
        success: true,
        message: "Account connected",
        time: Date.now(),
        status: 200,
      };
    } else {
      console.log(`Session expired for store: ${store_id}`);
      await home_page.close();
      if (appConfig.webhook.alert_session_expired) {
        await sendWebhook(
          "session_expired",
          store_id,
          "Session expired. Please reconnect your account.",
        );
      }
      return {
        success: false,
        message: "Session expired. Please reconnect your account.",
        status: 401,
        time: Date.now(),
      };
    }
  } catch (error: any) {
    await home_page.close();
    console.log(error?.message);
    console.log("Closing page");
    return {
      success: false,
      message: error.message,
      time: Date.now(),
      status: 500,
    };
  }
}
