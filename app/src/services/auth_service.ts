import config from "../../../app.config.json" with{type: "json"}
import { CountryType } from "../types/countries.js";
import countries from "../../../countries.json" with{type: "json"}
import { Service } from "./service.js";
import { WaveSyncFIleSystem } from "../../wavesync/contracts/WaveSyncFIleSystem.js";
import { WaveSyncBrowser } from "../../wavesync/contracts/WaveSyncBrowser.js";
import { WaveSyncEvent } from "../../wavesync/contracts/WaveSyncEvent.js";
import { WaveSyncCookieInterface } from "../../wavesync/contracts/WaveSyncCookie.js";

interface LoginCredentials {
    store_id: string;
    phone: string;
    password: string;
    country: string;
}

export class AuthService extends Service {
    constructor(
        protected fs: WaveSyncFIleSystem, 
        protected browser: WaveSyncBrowser,
        protected event: WaveSyncEvent,
        protected cookie: WaveSyncCookieInterface
    ) {
        super(fs);
    }

    public async submit_otp(store_id: string, code: string) {
        this.event.emit(`otp_${store_id}`, code);
        return {
            success: true,
            message: "otp submitted successfully",
            error: null
        }
    }

    public async login({ store_id, phone, password, country }: LoginCredentials) {
        let browser = null;
        let login_page = null;

        try {
            console.log("Login started")
            // 1. Initialize Browser
            browser = await this.browser.init_browser();
            login_page = await browser.newPage();
            await this.browser.set_viewport(login_page);

            // 2. Navigate
            await login_page.goto(config.urls.portal, {
                waitUntil: 'networkidle2',
                timeout: config.timeouts.page_load
            });

            // click on dropdown
            await login_page.locator("#country").setTimeout(config.timeouts.selector_visible).click();

            // set country map
            const country_items = countries as CountryType;
            const selected_counrtry = country_items[country];

            if (!selected_counrtry) {
                throw new Error("selected country not found");
            }

            // select country from dropdown
            await login_page.locator(selected_counrtry.attr).setTimeout(config.timeouts.selector_visible).click();

            // fill phone number
            await login_page.type("#mobile", phone, { delay: config.delays.typing_max });
            await login_page.locator('button[type="submit"]').setTimeout(config.timeouts.selector_visible).click();

            // fill password
            await login_page.locator("#password").setTimeout(config.timeouts.selector_visible).click();
            await login_page.locator("#password").fill(password);
            await login_page.locator('button[type="submit"]').setTimeout(config.timeouts.selector_visible).click();

            // wait for the otp to be submited
            const otpCode = await new Promise<string>((resolve, reject) => {
                this.send_webhook({
                    type: "otp:required",
                    message: "You received an OTP please submit it to access your account",
                    store_id
                });

                // define listener for retreiving otp
                const otpListener = (code: string) => {
                    clearTimeout(rejectTimeout);
                    console.log(`Otp retreived ${code} for ${store_id}`);
                    resolve(code);
                };

                // set timeout to close the page and reject if the not otp is sent to the server

                const rejectTimeout = setTimeout(() => {

                    this.event.remove_listener(`otp_${store_id}`, otpListener);
                    this.send_webhook({
                        type: "otp:failed",
                        message: "OTP timed out and request was cancelled",
                        store_id
                    });

                    reject(new Error("OTP_TIMEOUT"));
                }, config.timeouts.otp_wait);


                // listen to otp emiter
                this.event.listen_once(`otp_${store_id}`, otpListener);

            });

            await login_page.locator("#mobile").wait();
            // fill the otp from the data received
            await login_page.locator("#mobile").fill(otpCode);
            await login_page.locator('button[type="submit"]').click();

            // handle redirection
            await login_page.waitForNavigation({ waitUntil: "networkidle2", timeout: config.timeouts.login_redirection });

            await login_page.waitForSelector("::-p-text(Solde), ::-p-text(Transaction), ::-p-text(Montant), ::-p-text(Amount)", { timeout: config.timeouts.selector_visible });

            console.log("Successfully login");

            const s_id_cookie = (await browser.cookies()).filter((cookie) => cookie.name === "s_id")[0].value;
            
            // Save Cookie using DI service
            await this.cookie.store_cookie(store_id, s_id_cookie);

            this.send_webhook({
                type: "login:success",
                message: "Your account has successfully been connected to wave sync",
                store_id
            });

            await browser.close();
        } catch (error: any) {
            console.error(`Login failed for Store ID: ${store_id}`, error);

            if (browser) await browser.close();
            this.send_webhook({
                type: "login:failed",
                message: error.message,
                store_id
            });
        }
    }

    public async logout() { }

}


