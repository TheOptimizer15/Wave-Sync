import puppeteer from "puppeteer";

export interface WaveSyncBrowser {
    init_browser: () => Promise<puppeteer.Browser>;
    set_viewport: (page: puppeteer.Page) => Promise<void>;
    inject_store_cookie: (browser: puppeteer.Browser, s_id: string) => Promise<void>;
}