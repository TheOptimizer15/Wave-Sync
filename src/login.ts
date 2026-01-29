// login.ts

import { type Browser } from "puppeteer";

import appConfig from "../app.config.json" with { type: "json" };
import { type Express } from "express";
import countries from "../country.json" with { type: "json" };
import { otpEmitter } from "./emitter.js";
import { sendWebhook } from "./webhook.js";
import { store_cookie } from "./cookie.js";
import { CountryDataType } from "./types.js";
import { initBrowser } from "./browser.js";

export async function login(store_id: string, phone: string, password: string, country: string) {

    // open browser for login to account
    const browser = await initBrowser();

    // open page
    const login_page = await browser.newPage();
    login_page.setViewport({
        height: 1920,
        width: 1080,
    });

    try {
        await login_page.goto(appConfig.wave_portal_url, {
            waitUntil: "networkidle2",

        });
        console.log("Opening wave portal login page");

        // fill the form with phone and password
        await login_page.locator("#country").wait();
        await login_page.locator("#country").click();


        // select country
        const contry_map = countries as CountryDataType;
        const selected_counrtry = contry_map[country];

        if (!selected_counrtry) {
            throw new Error("Selected country does not exists");
        }

        await login_page.locator(selected_counrtry.attr).click();
        console.log(`Country selected: ${selected_counrtry.value}`);

        // submit phone
        await login_page.type("#mobile", phone, { delay: 100 });
        await login_page.locator('button[type="submit"]').click();

        // password
        await login_page.locator("#password").click();
        await login_page.locator("#password").fill(password);
        await login_page.locator('button[type="submit"]').click();

        // wait for the otp to be submited
        const otpCode = await new Promise<string>((resolve, reject) => {
            console.log("Password filled waiting for otp");
            // reach their webhook for otp notification alert
            if (appConfig.webhook.alert_otp) {
                sendWebhook("otp:required", "Otp is required", store_id);
            }

            // define listener for retreiving otp
            const otpListener = (code: string) => {
                clearTimeout(rejectTimeout);
                console.log(`Otp retreived ${code}`);
                resolve(code);
            };

            // set timeout to close the page and reject if the not otp is sent to the server

            const rejectTimeout = setTimeout(() => {
                if (appConfig.webhook.alert_otp) {
                    sendWebhook("otp:failed", "No otp receiced after timeout", store_id);
                }
                otpEmitter.off("otp", otpListener);

                reject(new Error("OTP_TIMEOUT"));
            }, appConfig.timeout);


            // listen to otp emiter
            otpEmitter.once("otp", otpListener);

            console.log("Endpoint active at post : /otp");
        });

        // wait for otp field to be avaible
        await login_page.locator("#mobile").wait();
        // fill the otp from the data received
        await login_page.locator("#mobile").fill(otpCode);
        await login_page.locator('button[type="submit"]').click();

        // wait for redirection 
        await login_page.waitForNavigation({ waitUntil: "networkidle0", timeout: appConfig.timeout });

        // 
        await login_page.waitForSelector("::-p-text(Solde), ::-p-text(Transaction), ::-p-text(Montant), ::-p-text(Amount)", { timeout: appConfig.timeout });

        console.log("Successfully login");

        // get the browser's cookie and store the s_id as json 
        const s_id_cookie = (await browser.cookies()).filter((cookie) => cookie.name === "s_id")[0].value;
        await store_cookie(store_id, s_id_cookie);

        // send webhook if enabled
        if (appConfig.webhook.alert_login) {
            sendWebhook("login:success", "Account logged in successfully", store_id);
        }

        // close browser
        await browser.close();
    } catch (error: any) {
        if (appConfig.webhook.alert_login) {
            sendWebhook("login:failed", error.message, store_id);
        }
        if (browser) await browser.close();
        console.log(error?.message);
        console.log("Closing login page");
    }
}
