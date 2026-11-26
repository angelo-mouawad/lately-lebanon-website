"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { PublicCategory } from "@latelylebanon/shared";
import { getMessages } from "@/i18n";
import { cn } from "@/lib/cn";
import { bagDrawer, cartCount, useCart, useWishlist } from "@/lib/shop-stores";
import { Drawer } from "@/components/ui/Drawer";
import { BagIcon, HeartIcon, MenuIcon, SearchIcon } from "@/components/ui/icons";
import { SearchOverlay } from "./SearchOverlay";

const t = getMessages();

const NAV = [
  { href: "/shop", label: t.nav.shop },
  { href: "/brands", label: t.nav.brands },
  { href: "/about", label: t.nav.about },
];

export function Header({ categories, storeName }: { categories: PublicCategory[]; storeName: string }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const lines = useCart();
  const saved = useWishlist();
  const count = cartCount(lines);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-ink bg-sand">
      <div className="mx-auto grid h-16 max-w-[1440px] grid-cols-[1fr_auto_1fr] items-center px-4 sm:px-6 lg:h-20 lg:px-10">
        <div className="flex items-center gap-1">
          <button type="button" className="-ml-2 p-2 lg:hidden" onClick={() => setMenuOpen(true)} aria-label={t.nav.menu}>
            <MenuIcon className="size-6" />
          </button>
          <nav aria-label="Main" className="hidden lg:block">
            <ul className="flex gap-8">
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={pathname.startsWith(item.href) ? "page" : undefined}
                    className={cn("label link-underline py-1", pathname.startsWith(item.href) && "bg-[length:100%_1px]")}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <Link href="/" className="block shrink-0" aria-label={`${storeName}, home`}>
          {/* eslint-disable-next-line @next/next/no-img-element -- small static logo, no resizing needed */}
          <img
            src="/brand/lately-lebanon-wordmark.png"
            alt={storeName}
            width={969}
            height={160}
            className="h-6 w-auto sm:h-7 lg:h-8"
          />
        </Link>

        <div className="flex items-center justify-end gap-0.5 sm:gap-2">
          <button type="button" className="p-2" onClick={() => setSearchOpen(true)} aria-label={t.nav.search}>
            <SearchIcon className="size-[22px]" />
          </button>
          <Link href="/saved" className="relative hidden p-2 sm:block" aria-label={`${t.nav.wishlist} (${saved.length})`}>
            <HeartIcon className="size-[22px]" filled={saved.length > 0} />
          </Link>
          <button
            type="button"
            className="relative -mr-2 flex items-center gap-1.5 p-2"
            onClick={() => bagDrawer.open()}
            aria-label={`${t.nav.bag} (${count})`}
          >
            <BagIcon className="size-[22px]" />
            <span className="min-w-4 text-sm tabular-nums" aria-hidden>
              {count > 0 ? count : ""}
            </span>
          </button>
        </div>
      </div>

      <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} title={t.nav.menu} side="left" closeLabel={t.nav.close}>
        <nav aria-label="Mobile" className="flex flex-col">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="border-b border-line px-5 py-4 font-serif text-2xl">
              {item.label}
            </Link>
          ))}
          <Link href="/saved" className="border-b border-line px-5 py-4 font-serif text-2xl">
            {t.nav.wishlist}
          </Link>
          <p className="label px-5 pt-8 pb-3 text-muted">{t.shop.category}</p>
          {categories.map((c) => (
            <Link key={c.id} href={`/shop?category=${c.slug}`} className="px-5 py-2.5 text-[15px]">
              {c.name}
            </Link>
          ))}
        </nav>
      </Drawer>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
