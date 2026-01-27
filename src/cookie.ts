import { writeFile, readFile, mkdir } from "fs/promises";
import path from "path";

// this module saves users s_id cookie to a json file
// name the json file as the store id
export async function store_cookie(store_id: string, s_id: string) {
  try {
    const file_name = `${store_id}.json`;
    await mkdir(path.join(__dirname, "stores"), { recursive: true });
    await writeFile(
      path.join(__dirname, "stores", file_name),
      JSON.stringify({ s_id: s_id }),
    );
  } catch (error) {}
}

export async function load_cookie(store_id: string) {
  try {
    const file_name = `${store_id}.json`;
    const cookie = await readFile(
      path.join(__dirname, "stores", file_name),
      "utf-8",
    );
    const s_id: { s_id: string } = JSON.parse(cookie);
    return s_id;
  } catch (error) {}
}
