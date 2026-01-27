import { type Browser } from "puppeteer";
import appConfig from "../app.config.json" with { type: "json" };
import { WaveApiResponse, MerchantSaleEntry } from "./transaction.type.js";
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

export async function transactions(browser: Browser, store_id: string) {
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

  const transaction_page = await browser.newPage();

  try {
    // Inject the s_id cookie before navigating
    await transaction_page.setCookie({
      name: "s_id",
      value: cookieData.s_id,
      domain: "business.wave.com",
      path: "/",
      httpOnly: false,
      secure: true,
    });

    await transaction_page.goto(appConfig.wave_transaction_url, {
      waitUntil: "networkidle2",
      timeout: appConfig.timeout,
    });

    const is_logged_in = await transaction_page.evaluate(() =>
      document.body.innerText.includes("Solde"),
    );

    if (!is_logged_in) {
      console.log(`Session expired for store: ${store_id}`);
      await transaction_page.close();
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
        time: Date.now(),
        status: 401,
      };
    }

    console.log("Loading transactions...");

    await transaction_page.waitForSelector("#limit-field", {
      timeout: appConfig.timeout,
    });

    // Create a promise that resolves when the specific GraphQL response is intercepted
    const transaction_response = new Promise((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error("Transaction timeout")),
        30000,
      );

      transaction_page.on("response", async (response) => {
        const url = response.url();
        const request = response.request();

        if (url.includes("business_graphql") && request.method() === "POST") {
          const postData = await request.fetchPostData(); // Use standard postData()

          if (postData?.includes("HistoryEntries_BusinessWalletHistoryQuery")) {
            try {
              const jsonResponse: Promise<WaveApiResponse> =
                await response.json();
              const paymentHistories = (
                await jsonResponse
              )?.data?.me?.businessUser?.business?.walletHistory?.historyEntries
                ?.filter((entry) => entry?.__typename === "MerchantSaleEntry")
                .map((entry) => ({
                  payment_reference: entry.id,
                  transfer_id: entry.transferId,
                  fee: entry.feeAmount.replace("CFA ", ""),
                  amount: entry.amount.replace("CFA ", ""),
                  client_name: entry.customerName,
                  client_reference: entry.clientReference,
                  phone: entry.customerMobile.replace(/\s+/g, ""),
                  time: entry.whenEntered,
                }))
                .reverse();

              clearTimeout(timeout);
              resolve(paymentHistories);
            } catch (e: any) {
              throw new Error(e.message);
            }
          }
        }
      });
    });

    // Trigger the request by filling the limit field
    await transaction_page.locator("#limit-field").fill("40");
    // Press Enter if necessary to trigger the refresh
    await transaction_page.keyboard.press("Enter");

    // Wait for the promise to resolve with data
    const data = await transaction_response;

    await transaction_page.close();

    // return the data
    console.log("Closing page, transaction retreived");
    return {
      success: true,
      message: "transactions retrieved",
      error: null,
      transactions: data,
      status: 200,
      time: Date.now(),
    };
  } catch (error: any) {
    if (!transaction_page.isClosed()) await transaction_page.close();
    console.error("Error:", error.message);
    return {
      success: false,
      message: error.message,
      error: error.message,
      transactions: null,
      status: 500,
      time: Date.now(),
    };
  }
}
