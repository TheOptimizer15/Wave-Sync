import { type Browser } from "puppeteer";
import appConfig from "../app.config.json" with { type: "json" };
import { WaveApiResponse, MerchantSaleEntry } from "./transaction.type.js";

export async function transactions(browser: Browser) {
    const transaction_page = await browser.newPage();

    try {
        await transaction_page.goto(appConfig.wave_transaction_url, {
            waitUntil: 'networkidle2',
            timeout: appConfig.timeout
        });

        const isLoggedIn = await transaction_page.evaluate(() =>
            document.body.innerText.includes('Solde')
        );

        if(!isLoggedIn){
            throw new Error("Not logged in");
        }

        console.log("Loading transactions...");

        await transaction_page.waitForSelector("#limit-field", { timeout: appConfig.timeout });

        // Create a promise that resolves when the specific GraphQL response is intercepted
        const interceptResponse = new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error("Transaction timeout")), 30000);

            transaction_page.on('response', async (response) => {
                const url = response.url();
                const request = response.request();

                if (url.includes("business_graphql") && request.method() === "POST") {
                    const postData = await request.fetchPostData(); // Use standard postData()

                    if (postData?.includes('HistoryEntries_BusinessWalletHistoryQuery')) {
                        try {
                            const jsonResponse: Promise<WaveApiResponse> = await response.json();
                            const paymentHistories = (await jsonResponse)?.data?.me?.businessUser?.business?.walletHistory?.historyEntries?.filter(
                                (entry) => entry?.__typename === "MerchantSaleEntry"
                            ).map((entry) => ({
                                id: entry.id,
                                amount: entry.amount.replace("CFA ", ""),
                                fee: entry.feeAmount.replace("CFA ", ""),
                                transfer_id: entry.transferId,
                                phone: entry.customerMobile.replace(/\s+/g, ''),
                                client_name: entry.customerName,
                                time: entry.whenEntered,
                            }));

                            clearTimeout(timeout);
                            resolve(paymentHistories);
                        } catch (e) {
                            // If response isn't JSON or body is consumed
                        }
                    }
                }
            });
        });

        // Trigger the request by filling the limit field
        await transaction_page.locator("#limit-field").fill("40");
        // Press Enter if necessary to trigger the refresh
        await transaction_page.keyboard.press('Enter');

        // Wait for the promise to resolve with data
        const data = await interceptResponse;

        await transaction_page.close();

        // return the data
        console.log("Closing page, transaction retreived");
        return {
            success: true,
            message: "transactions retrieved",
            error: null,
            transactions: data
        };

    } catch (error: any) {
        if (!transaction_page.isClosed()) await transaction_page.close();
        console.error("Error:", error.message);
        return {
            success: false,
            message: "Error occurred",
            error: error.message,
            transactions: null
        };
    }
}