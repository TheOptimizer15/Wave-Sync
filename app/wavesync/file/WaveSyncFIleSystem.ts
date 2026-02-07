import { fileURLToPath } from 'url';
import path from 'path';
import { access, constants, readFile, writeFile, unlink, mkdir } from 'fs/promises';

export class WaveSyncFileSystem {
    protected __dirname: string;

    constructor() {
        const filename = fileURLToPath(import.meta.url);
        this.__dirname = path.dirname(filename);
    }

    private get_full_path(relative_path: string): string {
        return path.resolve(this.__dirname, relative_path);
    }

    async file_exists(rel_path: string): Promise<boolean> {
        try {
            await access(this.get_full_path(rel_path), constants.F_OK);
            return true;
        } catch {
            return false;
        }
    }

    async load_file(rel_path: string): Promise<string> {
        const content = await readFile(this.get_full_path(rel_path), "utf-8");
        return content;
    }

    async store_file(rel_path: string, data: string | Buffer): Promise<void> {
        const full_path = this.get_full_path(rel_path);
        const dir_path = path.dirname(full_path);
        
        await mkdir(dir_path, { recursive: true });
        
        await writeFile(full_path, data, "utf-8");
    }

    async delete_file(rel_path: string): Promise<void> {
        await unlink(this.get_full_path(rel_path));
    }
}
