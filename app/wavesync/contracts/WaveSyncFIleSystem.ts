export interface WaveSyncFIleSystem {
    file_exists: (rel_path: string) => Promise<boolean>
    load_file: (rel_path: string) => Promise<string>
    store_file: (rel_path: string, data: string | Buffer) => Promise<void>
    delete_file: (rel_path: string) => Promise<void>
}