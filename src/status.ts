// status.ts
import { type Browser } from "puppeteer";
import appConfig from "../app.config.json" with { type: "json" };
import { load_cookie } from "./cookie.js";
import { sendWebhook } from "./webhook.js";
import { initBrowser, viewPort } from "./browser.js";


// get page content to load if there is solde send response for to mark the account as active
export async function status(store_id: string) {

  // Load cookie for this store
  const cookieData = await load_cookie(store_id);
  // if no cookie found emit an event and return response
  if (!cookieData) {
    console.log(`No config file found for store: ${store_id}`);
    if (appConfig.webhook.alert_no_config) {
      await sendWebhook("config:failed", "No config file found, make sure you configured your wave account", store_id);
    }
    return {
      success: false,
      message: "No config file found. Please connect your account.",
      time: Date.now(),
      status: 404,
    };
  }

  // open browser
  const browser = await initBrowser();
  const home_page = await browser.newPage();
  viewPort(home_page)

  try {
    // Inject the s_id cookie before navigating
    await browser.setCookie({
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

    await home_page.waitForSelector("::-p-text(Solde), ::-p-text(Transaction), ::-p-text(Montant), ::-p-text(Amount)", {
      timeout: 16000
    });

    console.log("Account is active");

    await browser.close();
    return {
      success: true,
      message: "Account connected",
      time: Date.now(),
      status: 200,
    };

  } catch (error: any) {
    if (browser) await browser.close();
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
