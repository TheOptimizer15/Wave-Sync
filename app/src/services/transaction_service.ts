import { Service } from "./service.js";
import { WaveSyncBrowser } from "../../wavesync/contracts/WaveSyncBrowser.js";
import { WaveSyncFIleSystem } from "../../wavesync/contracts/WaveSyncFIleSystem.js";
import { WaveSyncCookie } from "../../wavesync/contracts/WaveSyncCookie.js";
import appConfig from "../../../app.config.json" with { type: "json" };
import { HTTPResponse } from "puppeteer";
import { WaveApiResponse, HistoryEntry, MerchantSaleEntry } from "../types/wave_response.js";

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

export class TransactionService extends Service {
    constructor(
        protected fs: WaveSyncFIleSystem,
        protected browser: WaveSyncBrowser,
        protected cookie: WaveSyncCookie
    ) {
        super(fs);
    }

    public async get_transactions(store_id: string) {
        return this.fetch_transactions(store_id);
    }

    public async verify_transaction(store_id: string, client_reference: string) {
        return this.fetch_transactions(store_id, client_reference);
    }

    private async fetch_transactions(store_id: string, filter_client_ref?: string) {
        const cookieData = await this.cookie.load_cookie(store_id);

        if (!cookieData) {
            await this.send_webhook({
                type: "config:failed",
                message: "No config file found.",
                store_id
            });
            return { success: false, message: "No config file found.", status: 404 };
        }

        let browser_instance = null;
        try {
            browser_instance = await this.browser.init_browser();
            const page = await browser_instance.newPage();
            await this.browser.set_viewport(page);

            await this.browser.inject_store_cookie(browser_instance, cookieData.s_id);

            await page.goto(appConfig.urls.transactions, {
                waitUntil: "networkidle2",
                timeout: appConfig.timeouts.page_load, // Using page_load timeout
            });

            const is_logged_in = await page.evaluate(() =>
                document.body.innerText.includes("Solde")
            );

            if (!is_logged_in) {
                await browser_instance.close();
                // "session_expired" isn't in WebhookAlertType technically, mapped to login:failed maybe?
                // The legacy code used "session_expired", let's use "login:failed" as closest match for now or just log.
                 await this.send_webhook({
                    type: "login:failed",
                    message: "Session expired.",
                    store_id
                });
                return { success: false, message: "Session expired.", status: 401 };
            }

            console.log("Setting up type-safe multi-packet collector...");

            const allCapturedEntries: HistoryEntry[] = [];
            const key = "HistoryEntries_BusinessWalletHistoryQuery";

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
                            // Ignore
                        }
                    }
                }
            };

            page.on("response", onResponse);

            console.log("Triggering transactions load...");
            const limitInput = await page.waitForSelector("#limit-field");
            await limitInput?.click({ clickCount: 3 });
            await limitInput?.type("0");
            await page.keyboard.press("Enter");

            await new Promise((resolve) => setTimeout(resolve, 5000));

            page.off("response", onResponse);

            const uniqueMap = new Map<string, HistoryEntry>();
            allCapturedEntries.forEach((item) => uniqueMap.set(item.id, item));
            const mergedEntries = Array.from(uniqueMap.values());

            let salesOnly: FormattedTransaction[] = mergedEntries
                .filter((entry): entry is MerchantSaleEntry => entry.__typename === "MerchantSaleEntry")
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
            
            if (filter_client_ref) {
                 salesOnly = salesOnly.filter(t => t.client_reference === filter_client_ref);
                 if (salesOnly.length < 1) {
                    await browser_instance.close();
                    return {
                        success: false,
                        message: "transaction not found",
                        transaction: null,
                        status: 404,
                        time: Date.now(),
                    }
                 }
                   await browser_instance.close();
                   return {
                    success: true,
                    message: "transaction retrieved",
                    transaction: salesOnly,
                    status: 200,
                    time: Date.now(),
                };
            }

            await browser_instance.close();

            return {
                success: true,
                message: "transactions retrieved",
                transactions: salesOnly,
                count: salesOnly.length,
                status: 200,
                time: Date.now(),
            };

        } catch (error: any) {
            if (browser_instance) await browser_instance.close();
            console.error("Scraping Error:", error.message);
             return {
                success: false,
                message: error.message,
                transactions: null, // Keeps consistency with legacy return shape
                status: 500,
                time: Date.now(),
            };
        }
    }
}
