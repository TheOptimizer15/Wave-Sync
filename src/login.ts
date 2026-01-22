// login.ts

import { type Browser } from "puppeteer";
import credentials from "../config.json" with { type: "json" };
import appConfig from "../app.config.json" with { type: "json" };
import { type Express } from "express";

// login to wave account

export async function login(browser: Browser, app: Express) {
    // get the password
    const phone = credentials.mobile_phone;
    const password = credentials.password;

    // create page
    const login_page = await browser.newPage();
    login_page.setViewport({
        height: 1920,
        width: 1080
    })


    try {
        await login_page.goto(appConfig.wave_portal_url, { waitUntil: 'networkidle2' });
        console.log("Opening wave portal login page");

        const isLoginPage = await login_page.evaluate(() =>
            document.body.innerText.includes('Wave Business Portal')
        );

        if (!isLoginPage) {
            // if on login page cancel the process
            throw new Error("Account already logged in");
        }

        // fill the form with phone and password
        await login_page.locator("#country").wait();
        await login_page.locator("#country").click();
        // select country
        console.log("Selection country");
        await login_page.locator("[data-value='ci']").click();

        // submit phone
        await login_page.type('#mobile', credentials.mobile_phone, { delay: 100 });
        await login_page.locator('button[type="submit"]').click();
        console.log("Filling phone number");

        // password
        await login_page.locator("#password").click();
        await login_page.locator('#password').fill(credentials.password);
        await login_page.locator('button[type="submit"]').click();
        console.log("Filling password");

        // opening url for otp code
        const otpCode = await new Promise<string>((resolve, reject) => {

            // set timeout to close the page and reject if the not otp is sent to the server

            const rejectTimeout = setTimeout(() => {
                reject(new Error("OTP_TIMEOUT"));
            }, appConfig.timeout)

            // create endpoint
            app.post("/otp", (req, res) => {
                const { code } = req.body

                if (!code) {
                    console.log("Requête reçue sans champ 'code'");
                    res.status(400).json({ status: "error", message: "missing code" });
                    clearTimeout(rejectTimeout);
                    reject(new Error("OTP_NOT_PROVIDED"));
                }

                clearTimeout(rejectTimeout);
                console.log("OTP received:", code);
                res.json({ status: "success", message: "OTP retrieved" });
                resolve(code.toString());
            });

            console.log("Endpoint active at post : /otp")

        })

        // wait for otp field to be avaible
        await login_page.locator("#mobile").wait();
        // fill the otp from the data received
        await login_page.locator("#mobile").fill(otpCode);
        await login_page.locator('button[type="submit"]').click();
        console.log("Filling otp from request");

        await login_page.waitForNavigation({ waitUntil: 'networkidle0' });

        // wait for sold element to be visible then close the page and send a success
        const is_login_success = await login_page.evaluate(() =>
            document.body.innerText.includes('Solde')
        );

        if (is_login_success) {
            console.log("Successfully login");
            await login_page.close();
        } else {
            throw new Error("Could not login, retry proecess or check password")
        }



    } catch (error: any) {
        await login_page.close();
        console.log(error?.message)
        console.log("Closing login page")
    }

}