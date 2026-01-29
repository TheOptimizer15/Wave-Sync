// same exact function as transaction, the verify transactions needs the client reference to return data if no transaction found it will return false

import appConfig from "../app.config.json" with { type: "json" };
import { WaveApiResponse, MerchantSaleEntry, HistoryEntry } from "./transaction.type.js";
import { load_cookie } from "./cookie.js";
import { initBrowser } from "./browser.js";
import { sendWebhook } from "./webhook.js";
import { HTTPResponse } from "puppeteer";

/**
 * Result structure for the front-end/caller
 */
interface FormattedTransaction {
    payment_reference: string;
    transfer_id: string;
    fee: string;
    amount: string;
    client_name: string;
    client_reference: string | null;
    phone: string;
    time: string;
    payment_type: string;
}

export async function verifyTransaction(store_id: string, client_reference: string) {
    const cookieData = await load_cookie(store_id);

    if (!cookieData) {
        if (appConfig.webhook.alert_no_config) {
            await sendWebhook("no_config", store_id, "No config file found.");
        }
        return { success: false, message: "No config file found.", status: 404 };
    }

    const browser = await initBrowser();
    const transaction_page = await browser.newPage();

    try {
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
            document.body.innerText.includes("Solde")
        );

        if (!is_logged_in) {
            await transaction_page.close();
            if (appConfig.webhook.alert_session_expired) {
                await sendWebhook("session_expired", store_id, "Session expired.");
            }
            return { success: false, message: "Session expired.", status: 401 };
        }

        console.log("Setting up type-safe multi-packet collector...");

        // 1. Array to hold all intercepted entries using your HistoryEntry union type
        const allCapturedEntries: HistoryEntry[] = [];
        const key = "HistoryEntries_BusinessWalletHistoryQuery";

        // 2. Continuous Listener
        const onResponse = async (response: HTTPResponse) => {
            const url = response.url();
            if (url.includes("business_graphql") && response.request().method() === "POST") {
                const postData = await response.request().fetchPostData();
                if (postData?.includes(key)) {
                    try {
                        const json: WaveApiResponse = await response.json();
                        const entries = json.data.me.businessUser.business.walletHistory.historyEntries;

                        if (entries && entries.length > 0) {
                            allCapturedEntries.push(...entries);
                        }
                    } catch (e) {
                        // Ignore background pings that aren't valid history JSON
                    }
                }
            }
        };

        transaction_page.on("response", onResponse);

        // 3. Trigger the request
        console.log("Triggering transactions load...");
        const limitInput = await transaction_page.waitForSelector("#limit-field");
        await limitInput?.click({ clickCount: 3 });
        await limitInput?.type("0");
        await transaction_page.keyboard.press("Enter");

        // 4. WAIT for the stream to finish
        await new Promise((resolve) => setTimeout(resolve, 5000));

        // 5. Cleanup
        transaction_page.off("response", onResponse);

        // 6. DEDUPLICATE using a Map
        const uniqueMap = new Map<string, HistoryEntry>();
        allCapturedEntries.forEach((item) => uniqueMap.set(item.id, item));
        const mergedEntries = Array.from(uniqueMap.values());

        // 7. FILTER AND MAP (Strictly MerchantSaleEntry)
        // We use a type guard to ensure the compiler knows we are handling MerchantSaleEntry
        const salesOnly: FormattedTransaction[] = mergedEntries
            .filter((entry): entry is MerchantSaleEntry => entry.__typename === "MerchantSaleEntry" && entry.clientReference === client_reference)
            .map((entry) => ({
                payment_reference: entry.id,
                transfer_id: entry.transferId,
                fee: entry.feeAmount.replace("CFA ", ""),
                amount: entry.amount.replace("CFA ", ""),
                client_name: entry.customerName,
                client_reference: entry.clientReference,
                phone: entry.customerMobile.replace(/\s+/g, ""),
                time: entry.whenEntered,
                payment_type: entry.actionSource,
            }))
            .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

        console.log(`Successfully retrieved ${salesOnly.length} unique sales.`);

        await transaction_page.close();
        await browser.close();

        if (salesOnly.length < 1) {
            return {
                success: false,
                message: "transaction not found",
                transaction: null,
                status: 404,
                time: Date.now(),
            }
        }
        return {
            success: true,
            message: "transaction retrieved",
            transaction: salesOnly,
            status: 200,
            time: Date.now(),
        };

    } catch (error: any) {
        if (browser) await browser.close();
        console.error("Scraping Error:", error.message);
        return {
            success: false,
            message: error.message,
            transactions: null,
            status: 500,
            time: Date.now(),
        };
    }
}