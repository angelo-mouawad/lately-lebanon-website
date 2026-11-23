export interface StorageDriver {
  /** Saves a file at a relative path such as "products/abc123_1600x2000-800.webp". */
  put(path: string, data: Buffer, contentType: string): Promise<void>;
  delete(path: string): Promise<void>;
  /** Public URL for a relative path. */
  url(path: string): string;
}
