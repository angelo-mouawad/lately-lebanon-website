import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type { StorageDriver } from "./driver";

/**
 * Saves files under UPLOAD_DIR. Point UPLOAD_DIR outside the app folder so redeploys
 * never wipe uploaded photos. The API serves the folder at /uploads.
 */
export function localDriver(rootDir: string, publicBaseUrl: string): StorageDriver {
  const root = path.resolve(rootDir);
  const base = publicBaseUrl.replace(/\/$/, "");

  const resolve = (relative: string) => {
    const full = path.resolve(root, relative);
    if (!full.startsWith(root + path.sep)) throw new Error("Invalid storage path");
    return full;
  };

  return {
    async put(relative, data) {
      const full = resolve(relative);
      await mkdir(path.dirname(full), { recursive: true });
      await writeFile(full, data);
    },
    async delete(relative) {
      try {
        await unlink(resolve(relative));
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
      }
    },
    url(relative) {
      return `${base}/${relative}`;
    },
  };
}
