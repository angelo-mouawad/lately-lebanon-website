import type { SVGProps } from "react";

/** A deliberately small icon set, thin strokes, used only where an icon earns its place. */
type IconProps = SVGProps<SVGSVGElement>;

const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "square" as const };

export const CloseIcon = (p: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden {...p}>
    <path d="M5 5l14 14M19 5L5 19" {...stroke} />
  </svg>
);

export const MenuIcon = (p: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden {...p}>
    <path d="M3 7h18M3 12h18M3 17h18" {...stroke} />
  </svg>
);

export const SearchIcon = (p: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden {...p}>
    <circle cx="10.5" cy="10.5" r="6.5" {...stroke} />
    <path d="M15.5 15.5L21 21" {...stroke} />
  </svg>
);

export const BagIcon = (p: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden {...p}>
    <path d="M4 8h16l-1 13H5L4 8z" {...stroke} />
    <path d="M8.5 8V6a3.5 3.5 0 017 0v2" {...stroke} />
  </svg>
);

export const HeartIcon = ({ filled, ...p }: IconProps & { filled?: boolean }) => (
  <svg viewBox="0 0 24 24" aria-hidden {...p}>
    <path
      d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0112 7.4a4.3 4.3 0 017.5 2.4C19.5 15.4 12 20 12 20z"
      {...stroke}
      fill={filled ? "currentColor" : "none"}
    />
  </svg>
);

export const ArrowRightIcon = (p: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden {...p}>
    <path d="M4 12h15M13 6l6 6-6 6" {...stroke} />
  </svg>
);

export const ArrowLeftIcon = (p: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden {...p}>
    <path d="M20 12H5M11 6l-6 6 6 6" {...stroke} />
  </svg>
);

export const ChevronDownIcon = (p: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden {...p}>
    <path d="M6 9l6 6 6-6" {...stroke} />
  </svg>
);

export const PlusIcon = (p: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden {...p}>
    <path d="M12 5v14M5 12h14" {...stroke} />
  </svg>
);

export const MinusIcon = (p: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden {...p}>
    <path d="M5 12h14" {...stroke} />
  </svg>
);

export const DragIcon = (p: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden {...p}>
    <path d="M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01" {...stroke} strokeWidth={2.6} />
  </svg>
);

export const WhatsAppIcon = (p: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden {...p}>
    <path
      fill="currentColor"
      d="M12.04 2a9.9 9.9 0 00-8.5 15l-1.4 5 5.2-1.4A9.9 9.9 0 1012.04 2zm0 18.1a8.2 8.2 0 01-4.2-1.1l-.3-.2-3.1.8.8-3-.2-.3a8.2 8.2 0 117 3.8zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 01-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 00-.7.3 3 3 0 00-.9 2.2 5.2 5.2 0 001.1 2.7 11.8 11.8 0 004.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3z"
    />
  </svg>
);

export const InstagramIcon = (p: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden {...p}>
    <rect x="3.5" y="3.5" width="17" height="17" {...stroke} />
    <circle cx="12" cy="12" r="4" {...stroke} />
    <path d="M17.2 6.8h.01" {...stroke} strokeWidth={2.4} />
  </svg>
);

export const UploadIcon = (p: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden {...p}>
    <path d="M12 16V4M7 9l5-5 5 5M4 20h16" {...stroke} />
  </svg>
);
