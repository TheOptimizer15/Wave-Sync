import { writeFile, readFile, mkdir } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// Get __dirname equivalent for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storesDir = path.join(__dirname, "..", "stores");

// this module saves users s_id cookie to a json file
// name the json file as the store id
export async function store_cookie(store_id: string, s_id: string) {
  try {
    const file_name = `${store_id}.json`;
    await mkdir(storesDir, { recursive: true });
    await writeFile(
      path.join(storesDir, file_name),
      JSON.stringify({ s_id: s_id }),
    );
    console.log(`Cookie saved to ${path.join(storesDir, file_name)}`);
  } catch (error) {
    console.log("Error saving cookie:", error);
  }
}

export async function load_cookie(store_id: string) {
  try {
    const file_name = `${store_id}.json`;
    const filePath = path.join(storesDir, file_name);
    console.log(`Attempting to load cookie from: ${filePath}`);
    const cookie = await readFile(filePath, "utf-8");
    const s_id: { s_id: string } = JSON.parse(cookie);
    console.log(`Cookie loaded successfully for store: ${store_id}`);
    return s_id;
  } catch (error) {
    console.log("Error loading cookie:", error);
  }
}

export async function delete_cookie(store_id: string) {
  try {
    const file_name = `${store_id}.json`;
    const filePath = path.join(storesDir, file_name);
    const { unlink } = await import("fs/promises");
    await unlink(filePath);
    console.log(`Cookie deleted for store: ${store_id}`);
    return true;
  } catch (error) {
    console.log("Error deleting cookie:", error);
    return false;
  }
}
