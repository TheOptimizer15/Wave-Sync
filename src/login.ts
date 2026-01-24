// login.ts

import { type Browser } from "puppeteer";
import credentials from "../config.json" with { type: "json" };
import appConfig from "../app.config.json" with { type: "json" };
import { type Express } from "express";
import country from "../country.json" with { type: "json" };
import { otpEmitter } from "./emitter.js";
import { callWebhook } from "./webhook.js";

// login to wave account

export async function login(browser: Browser, app: Express) {
    // get the password
    const phone = credentials.mobile_phone;
    const password = credentials.password;

    // create page
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

        const isLoginPage = await login_page.evaluate(() =>
            document.body.innerText.includes("Wave Business Portal"),
        );

        if (!isLoginPage) {
            // if on login page cancel the process
            throw new Error("Account already logged in");
        }

        // fill the form with phone and password
        await login_page.locator("#country").wait();
        await login_page.locator("#country").click();
        // select country
        console.log("Selecting country");
        const selectedCountry = country.ci;
        await login_page.locator(selectedCountry.attr).click();
        console.log(`Country selected: ${selectedCountry.value}`);

        // submit phone
        await login_page.type("#mobile", credentials.mobile_phone, { delay: 100 });
        await login_page.locator('button[type="submit"]').click();
        console.log("Filling phone number");

        // password
        await login_page.locator("#password").click();
        await login_page.locator("#password").fill(credentials.password);
        await login_page.locator('button[type="submit"]').click();
        console.log("Filling password");

        // opening url for otp code
        const otpCode = await new Promise<string>((resolve, reject) => {
            console.log("Password filled waiting for otp");
            // reach their webhook for otp notification alert
            if (appConfig.webhook.alert_otp) {
                callWebhook(appConfig.webhook.url, {
                    event: "otp:required",
                    time: new Date().toLocaleTimeString(),
                    time_stamp: Date.now(),
                });
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
                    callWebhook(appConfig.webhook.url, {
                        event: "otp:failed",
                        time: new Date().toLocaleTimeString(),
                        time_stamp: Date.now(),
                    });
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
        console.log("Filling otp from request");

        await login_page.waitForNavigation({ waitUntil: "networkidle0" });

        // wait for sold element to be visible then close the page and send a success
        await login_page.waitForSelector("::-p-text(Solde)", { timeout: appConfig.timeout });

        console.log("Successfully login");
        if (appConfig.webhook.alert_login) {
            callWebhook(appConfig.webhook.url, {
                event: "login:success",
                time: new Date().toLocaleTimeString(),
                time_stamp: Date.now(),
            });
        }
        await login_page.close();
    } catch (error: any) {
        if (appConfig.webhook.alert_login) {
            callWebhook(appConfig.webhook.url, {
                event: "login:failed",
                time: new Date().toLocaleTimeString(),
                time_stamp: Date.now(),
                message: error.message,
            });
        }
        await login_page.close();
        console.log(error?.message);
        console.log("Closing login page");
    }
}
