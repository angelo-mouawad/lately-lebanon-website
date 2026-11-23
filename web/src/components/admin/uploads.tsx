"use client";

import Image from "next/image";
import { useId, useRef, useState, type DragEvent } from "react";
import type { ImageSet, UploadKind, UploadResult } from "@latelylebanon/shared";
import { adminFetch } from "@/lib/admin-api";
import { errorMessage } from "@/lib/api-error";
import { cn } from "@/lib/cn";
import { ArrowLeftIcon, ArrowRightIcon, CloseIcon, DragIcon, UploadIcon } from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/Skeleton";

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp,image/avif";

function checkFile(file: File): string | null {
  if (!file.type.startsWith("image/")) return `"${file.name}" isn't a photo.`;
  if (file.size > MAX_BYTES) return `"${file.name}" is too large. Please use photos under 10 MB.`;
  return null;
}

export async function uploadImage(file: File, kind: UploadKind): Promise<ImageSet> {
  const form = new FormData();
  form.append("file", file);
  const { image } = await adminFetch<UploadResult>(`/uploads?kind=${kind}`, { method: "POST", form });
  return image;
}

function DropZone({
  onFiles,
  multiple,
  label,
  hint,
  busy,
  className,
}: {
  onFiles: (files: File[]) => void;
  multiple?: boolean;
  label: string;
  hint?: string;
  busy?: boolean;
  className?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const id = useId();

  function drop(e: DragEvent) {
    e.preventDefault();
    setOver(false);
    const files = [...e.dataTransfer.files];
    if (files.length) onFiles(multiple ? files : files.slice(0, 1));
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={drop}
      className={cn(
        "flex flex-col items-center justify-center gap-2 border border-dashed p-6 text-center transition-colors",
        over ? "border-ink bg-sand" : "border-line-strong bg-paper",
        className,
      )}
    >
      <UploadIcon className="size-6 text-muted" />
      <label htmlFor={id} className="cursor-pointer text-sm">
        <span className="font-medium underline underline-offset-4">{label}</span>
        <span className="hidden text-muted sm:inline"> or drag {multiple ? "photos" : "a photo"} here</span>
      </label>
      {hint && <p className="text-xs text-muted">{hint}</p>}
      <input
        ref={input}
        id={id}
        type="file"
        accept={ACCEPT}
        multiple={multiple}
        disabled={busy}
        className="sr-only"
        onChange={(e) => {
          const files = [...(e.target.files ?? [])];
          if (files.length) onFiles(files);
          e.target.value = "";
        }}
      />
    </div>
  );
}

/** One photo, such as a brand logo, cover or category image. */
export function SingleImageUpload({
  value,
  onChange,
  kind,
  hint,
  aspect = "aspect-square",
}: {
  value: ImageSet | null;
  onChange: (image: ImageSet | null) => void;
  kind: UploadKind;
  hint?: string;
  aspect?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handle(files: File[]) {
    const file = files[0];
    if (!file) return;
    const problem = checkFile(file);
    if (problem) return setError(problem);
    setBusy(true);
    setError(null);
    try {
      onChange(await uploadImage(file, kind));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {busy ? (
        <Skeleton className={cn("w-full max-w-xs", aspect)} />
      ) : value ? (
        <div className="flex flex-col gap-2">
          <div className={cn("relative w-full max-w-xs overflow-hidden border border-line bg-sand-deep", aspect)}>
            <Image src={value.lg} alt="" fill sizes="320px" className="object-cover" />
          </div>
          <div className="flex gap-2">
            <label className="cursor-pointer text-sm underline underline-offset-4">
              Replace
              <input
                type="file"
                accept={ACCEPT}
                className="sr-only"
                onChange={(e) => {
                  void handle([...(e.target.files ?? [])]);
                  e.target.value = "";
                }}
              />
            </label>
            <button type="button" className="text-sm text-danger underline underline-offset-4" onClick={() => onChange(null)}>
              Remove
            </button>
          </div>
        </div>
      ) : (
        <DropZone label="Choose a photo" hint={hint} onFiles={(f) => void handle(f)} className="max-w-xs" />
      )}
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export type PhotoItem = ImageSet;

/**
 * Product photos: drop several at once, drag to reorder (or use the arrows on a phone).
 * The first photo is the main one shown in the shop.
 */
export function PhotoManager({
  photos,
  onChange,
  productName,
  error: fieldError,
}: {
  photos: PhotoItem[];
  onChange: (photos: PhotoItem[]) => void;
  productName: string;
  error?: string;
}) {
  const [pending, setPending] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const latest = useRef(photos);
  latest.current = photos;

  async function handle(files: File[]) {
    const problems = files.map(checkFile).filter(Boolean);
    const good = files.filter((f) => !checkFile(f));
    setError(problems[0] ?? null);
    setPending((n) => n + good.length);
    for (const file of good) {
      try {
        const image = await uploadImage(file, "product");
        onChange([...latest.current, { ...image, alt: "" }]);
      } catch (err) {
        setError(errorMessage(err));
      } finally {
        setPending((n) => n - 1);
      }
    }
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= photos.length || from === to) return;
    const next = [...photos];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item!);
    onChange(next);
  }

  function update(index: number, alt: string) {
    onChange(photos.map((p, i) => (i === index ? { ...p, alt } : p)));
  }

  return (
    <div className="flex flex-col gap-4">
      {(photos.length > 0 || pending > 0) && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((photo, index) => (
            <li
              key={photo.key}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIndex !== null) move(dragIndex, index);
                setDragIndex(null);
              }}
              onDragEnd={() => setDragIndex(null)}
              className={cn("flex flex-col border bg-paper", dragIndex === index ? "border-ink opacity-50" : "border-line")}
            >
              <div className="relative aspect-4/5 cursor-grab bg-sand-deep active:cursor-grabbing">
                <Image src={photo.md} alt="" fill sizes="240px" className="object-cover" />
                {index === 0 && <span className="label absolute top-0 left-0 bg-ink px-2 py-1 text-paper">Main photo</span>}
                <span className="absolute top-1 right-1 hidden bg-paper/90 p-1 sm:block" aria-hidden>
                  <DragIcon className="size-4" />
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-line">
                <button
                  type="button"
                  className="p-2.5 hover:text-terracotta disabled:opacity-30"
                  onClick={() => move(index, index - 1)}
                  disabled={index === 0}
                  aria-label="Move photo earlier"
                >
                  <ArrowLeftIcon className="size-4 flip-rtl" />
                </button>
                <button
                  type="button"
                  className="p-2.5 text-danger hover:bg-danger-soft"
                  onClick={() => onChange(photos.filter((_, i) => i !== index))}
                  aria-label="Remove photo"
                >
                  <CloseIcon className="size-4" />
                </button>
                <button
                  type="button"
                  className="p-2.5 hover:text-terracotta disabled:opacity-30"
                  onClick={() => move(index, index + 1)}
                  disabled={index === photos.length - 1}
                  aria-label="Move photo later"
                >
                  <ArrowRightIcon className="size-4 flip-rtl" />
                </button>
              </div>
              <label className="border-t border-line">
                <span className="sr-only">Photo description</span>
                <input
                  value={photo.alt}
                  onChange={(e) => update(index, e.target.value)}
                  placeholder={productName || "Photo description"}
                  className="w-full bg-transparent px-2.5 py-2 text-xs placeholder:text-muted focus:outline-none"
                />
              </label>
            </li>
          ))}
          {Array.from({ length: pending }, (_, i) => (
            <li key={`pending-${i}`} className="flex flex-col border border-line">
              <Skeleton className="aspect-4/5 w-full" />
              <p className="p-2.5 text-xs text-muted">Uploading</p>
            </li>
          ))}
        </ul>
      )}
      <DropZone
        multiple
        label={photos.length ? "Add more photos" : "Choose photos"}
        hint="JPG, PNG or WebP, up to 10 MB each. Portrait photos look best."
        onFiles={(f) => void handle(f)}
      />
      {(error || fieldError) && (
        <p role="alert" className="text-sm text-danger">
          {error ?? fieldError}
        </p>
      )}
      {photos.length > 1 && (
        <p className="text-sm text-muted">Drag photos to change the order, or use the arrows. The first photo is shown in the shop.</p>
      )}
    </div>
  );
}
