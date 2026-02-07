import puppeteer from "puppeteer";

export class WaveSyncBrowser {
    async init_browser() {
        return await puppeteer.launch({
            slowMo: 50,
            headless: false
        });
    }

    async set_viewport(page: puppeteer.Page) {
        page.setViewport({
            height: 1920,
            width: 1080,
        });
    }

    async inject_store_cookie(browser: puppeteer.Browser, s_id: string) {
        await browser.setCookie({
            name: "s_id",
            value: s_id,
            domain: "business.wave.com",
            path: "/",
            httpOnly: false,
            secure: true,
        });
    }

}