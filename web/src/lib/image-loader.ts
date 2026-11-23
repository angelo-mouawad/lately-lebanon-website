"use client";

import type { ImageLoaderProps } from "next/image";

const SIZES = [400, 800, 1600];
const UPLOAD_PATTERN = /-(400|800|1600)\.webp$/;

/**
 * Maps a requested width to one of the three stored WebP sizes.
 * Anything that isn't an upload (for example files in /public) is returned as is.
 */
export default function imageLoader({ src, width }: ImageLoaderProps): string {
  if (!UPLOAD_PATTERN.test(src)) return src;
  const size = SIZES.find((s) => s >= width) ?? 1600;
  return src.replace(UPLOAD_PATTERN, `-${size}.webp`);
}
