export interface WaveSyncCookie {
    store_cookie: (store_id: string, s_id: string) => Promise<void>;
    load_cookie: (store_id: string) => Promise<{ s_id: string } | null>;
    delete_cookie: (store_id: string) => Promise<boolean>;
}

// Alias for backward compatibility
export type WaveSyncCookieInterface = WaveSyncCookie;
