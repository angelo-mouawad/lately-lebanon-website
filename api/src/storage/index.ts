import { env } from "../lib/env";
import type { StorageDriver } from "./driver";
import { localDriver } from "./local";
import { s3Driver } from "./s3";

function createStorage(): StorageDriver {
  if (env.UPLOAD_DRIVER === "s3") {
    if (!env.S3_BUCKET || !env.S3_ACCESS_KEY_ID || !env.S3_SECRET_ACCESS_KEY || !env.UPLOADS_PUBLIC_URL) {
      throw new Error("UPLOAD_DRIVER=s3 needs S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY and UPLOADS_PUBLIC_URL");
    }
    return s3Driver({
      endpoint: env.S3_ENDPOINT,
      region: env.S3_REGION,
      bucket: env.S3_BUCKET,
      accessKeyId: env.S3_ACCESS_KEY_ID,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY,
      publicBaseUrl: env.UPLOADS_PUBLIC_URL,
    });
  }
  return localDriver(env.UPLOAD_DIR, env.UPLOADS_PUBLIC_URL ?? `${env.API_ORIGIN}/uploads`);
}

export const storage = createStorage();
