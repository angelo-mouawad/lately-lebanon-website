"use client";

import Image from "next/image";
import { useState } from "react";
import type { ImageSet } from "@latelylebanon/shared";
import { fmt, getMessages } from "@/i18n";
import { cn } from "@/lib/cn";
import { ArrowLeftIcon, ArrowRightIcon } from "@/components/ui/icons";
import { Modal } from "@/components/ui/Modal";

const t = getMessages();

/** Main photo with thumbnails. Tapping the photo opens a full size, zoomable view. */
export function ProductGallery({ images, name }: { images: ImageSet[]; name: string }) {
  const [index, setIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [zoomPoint, setZoomPoint] = useState<{ x: number; y: number } | null>(null);
  const current = images[index];
  const go = (delta: number) => setIndex((i) => (i + delta + images.length) % images.length);

  if (!current) return <div className="aspect-4/5 bg-sand-deep" />;

  return (
    <div className="flex flex-col gap-3 lg:flex-row-reverse lg:gap-4">
      <div className="relative flex-1">
        <button
          type="button"
          onClick={() => setZoomed(true)}
          className="relative block aspect-4/5 w-full cursor-zoom-in overflow-hidden bg-sand-deep"
          aria-label={`${t.product.zoom}: ${current.alt || name}`}
        >
          <Image
            key={current.key}
            src={current.lg}
            alt={current.alt || name}
            fill
            priority={index === 0}
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="animate-fade-in object-cover"
          />
        </button>
        {images.length > 1 && (
          <div className="absolute right-3 bottom-3 flex gap-px lg:hidden">
            <button type="button" onClick={() => go(-1)} className="flex size-10 items-center justify-center bg-paper/90" aria-label={t.shop.previous}>
              <ArrowLeftIcon className="size-5 flip-rtl" />
            </button>
            <button type="button" onClick={() => go(1)} className="flex size-10 items-center justify-center bg-paper/90" aria-label={t.shop.next}>
              <ArrowRightIcon className="size-5 flip-rtl" />
            </button>
          </div>
        )}
      </div>

      {images.length > 1 && (
        <ul className="flex gap-2 overflow-x-auto lg:w-20 lg:flex-col">
          {images.map((img, i) => (
            <li key={img.key} className="shrink-0">
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={fmt(t.product.photo, { n: i + 1, total: images.length })}
                aria-current={i === index}
                className={cn("relative block aspect-4/5 w-16 border bg-sand-deep lg:w-20", i === index ? "border-ink" : "border-transparent opacity-70 hover:opacity-100")}
              >
                <Image src={img.sm} alt="" fill sizes="80px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Modal open={zoomed} onClose={() => setZoomed(false)} title={name} size="lg" closeLabel={t.nav.close}>
        <div
          className="relative aspect-4/5 w-full cursor-crosshair overflow-hidden bg-sand-deep"
          onMouseMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            setZoomPoint({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
          }}
          onMouseLeave={() => setZoomPoint(null)}
        >
          <Image
            src={current.lg}
            alt={current.alt || name}
            fill
            sizes="(min-width: 768px) 768px, 100vw"
            className="object-cover transition-transform duration-150"
            style={zoomPoint ? { transform: "scale(2)", transformOrigin: `${zoomPoint.x}% ${zoomPoint.y}%` } : undefined}
          />
        </div>
        {images.length > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <button type="button" onClick={() => go(-1)} className="label link-underline py-1">
              {t.shop.previous}
            </button>
            <span className="text-sm text-muted tabular-nums">{fmt(t.product.photo, { n: index + 1, total: images.length })}</span>
            <button type="button" onClick={() => go(1)} className="label link-underline py-1">
              {t.shop.next}
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
