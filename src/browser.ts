import puppeteer, { Page } from "puppeteer";

export async function initBrowser() {
    return await puppeteer.launch({
        slowMo: 50,
        headless: false
    });
}

export async function viewPort(page: Page) {
    page.setViewport({
        height: 1920,
        width: 1080,
    });
}