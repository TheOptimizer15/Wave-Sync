// status.ts
import { type Browser } from "puppeteer";
import appConfig from "../app.config.json" with { type: "json" };

// get page content to load if there is solde send response for to mark the account as active
export async function status(browser: Browser) {
    const home_page = await browser.newPage();
    await home_page.goto(appConfig.wave_portal_url, { waitUntil: 'networkidle2' });
    try {

        const isLoggedIn = await home_page.evaluate(() =>
            document.body.innerText.includes('SOLDE')
        );

        if (isLoggedIn) {
            console.log("Account is active");
            await home_page.close();
            return {
                success: true,
                message: "Account connected",
                time: new Date().toLocaleDateString("fr"),
                status: 200
            };
        } else {
            console.log("Account is inactive");
            await home_page.close();
            return {
                success: false,
                message: "Account not connected",
                time: new Date().toLocaleDateString(),
                status: 401
            };
        }


    } catch (error: any) {
        await home_page.close();
        console.log(error?.message);
        console.log("Closing page")
        return {
            success: false,
            message: error.message,
            time: new Date().toLocaleDateString(),
            status: 500
        };
    }
}