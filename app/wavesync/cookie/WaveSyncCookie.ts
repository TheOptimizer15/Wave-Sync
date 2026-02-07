import { WaveSyncCookieInterface } from "../contracts/WaveSyncCookie.js";
import { WaveSyncFIleSystem } from "../contracts/WaveSyncFIleSystem.js";
import path from "path";

export class WaveSyncCookie implements WaveSyncCookieInterface {
    constructor(protected fs: WaveSyncFIleSystem) { }

    protected get_cookie_path(store_id: string): string {
        return path.join("..", "..", "stores", `${store_id}.json`);
    }

    async store_cookie(store_id: string, s_id: string): Promise<void> {
        try {
            const cookie_path = this.get_cookie_path(store_id);
          
            await this.fs.store_file(cookie_path, JSON.stringify({ s_id }));
        } catch (error) {
            console.error(`Error saving cookie for ${store_id}:`, error);
            throw error;
        }
    }

    async load_cookie(store_id: string): Promise<{ s_id: string } | null> {
        try {
            const cookie_path = this.get_cookie_path(store_id);
            if (!(await this.fs.file_exists(cookie_path))) {
                return null;
            }
            const content = await this.fs.load_file(cookie_path);
            return JSON.parse(content);
        } catch (error) {
            console.error(`Error loading cookie for ${store_id}:`, error);
            return null;
        }
    }

    async delete_cookie(store_id: string): Promise<boolean> {
        try {
            const cookie_path = this.get_cookie_path(store_id);
            await this.fs.delete_file(cookie_path);
            return true;
        } catch (error) {
            console.error(`Error deleting cookie for ${store_id}:`, error);
            return false;
        }
    }
}
