import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { StorageDriver } from "./driver";

export interface S3Options {
  endpoint?: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicBaseUrl: string;
}

/** S3-compatible storage, for example Cloudflare R2. */
export function s3Driver(options: S3Options): StorageDriver {
  const client = new S3Client({
    endpoint: options.endpoint,
    region: options.region,
    credentials: { accessKeyId: options.accessKeyId, secretAccessKey: options.secretAccessKey },
    forcePathStyle: Boolean(options.endpoint),
  });
  const base = options.publicBaseUrl.replace(/\/$/, "");

  return {
    async put(path, data, contentType) {
      await client.send(
        new PutObjectCommand({
          Bucket: options.bucket,
          Key: path,
          Body: data,
          ContentType: contentType,
          CacheControl: "public, max-age=31536000, immutable",
        }),
      );
    },
    async delete(path) {
      await client.send(new DeleteObjectCommand({ Bucket: options.bucket, Key: path }));
    },
    url(path) {
      return `${base}/${path}`;
    },
  };
}
