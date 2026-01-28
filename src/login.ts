// login.ts

import { type Browser } from "puppeteer";
import appConfig from "../app.config.json" with { type: "json" };
import { type Express } from "express";
import country from "../country.json" with { type: "json" };
import { otpEmitter } from "./emitter.js";
import { sendWebhook } from "./webhook.js";
import puppeteer from "puppeteer";  
import { store_cookie } from "./cookie.js";

// login to wave account

// UPDATE: Login to wave directly with the user given credentials
// after login get the cookie named s_id and store it in a json file named as the store id
// the json file will be stored in a folder named stores
// Use to load transactions, and account status
// if no json file for the store, throw error to trigger login:failed event

export async function login(store_id: string, phone: string, password: string) {

    // open browser for login to account
    const browser = await puppeteer.launch({
        headless: true,
        slowMo: 50
    });

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
        console.log("Selecting country");
        const selectedCountry = country.ci;
        await login_page.locator(selectedCountry.attr).click();
        console.log(`Country selected: ${selectedCountry.value}`);

        // submit phone
        await login_page.type("#mobile", phone, { delay: 100 });
        await login_page.locator('button[type="submit"]').click();
        console.log("Filling phone number");

        // password
        await login_page.locator("#password").click();
        await login_page.locator("#password").fill(password);
        await login_page.locator('button[type="submit"]').click();
        console.log("Filling password");

        // listen to otp event
        const otpCode = await new Promise<string>((resolve, reject) => {
            console.log("Password filled waiting for otp");
            // reach their webhook for otp notification alert
            if (appConfig.webhook.alert_otp) {
                sendWebhook(appConfig.webhook.url, {
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
                    sendWebhook(appConfig.webhook.url, {
                        event: "otp:failed",
                        time: Date.now()
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

        // store the cookie if login success
        const s_id_cookie = (await browser.cookies()).filter((cookie) => cookie.name === "s_id")[0].value;
        await store_cookie(store_id, s_id_cookie);
        console.log(s_id_cookie);

        // send webhook if enabled
        if (appConfig.webhook.alert_login) {
            sendWebhook(appConfig.webhook.url, {
                event: "login:success",
                time: Date.now()
            });
        }
        await login_page.close();
        await browser.close();
    } catch (error: any) {
        if (appConfig.webhook.alert_login) {
            sendWebhook(appConfig.webhook.url, {
                event: "login:failed",
                time: Date.now()
            });
        }
        await login_page.close();
        await browser.close();
        console.log(error?.message);
        console.log("Closing login page");
    }
}
