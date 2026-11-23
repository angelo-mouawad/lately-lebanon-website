"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Drawer } from "@/components/ui/Drawer";
import { MenuIcon } from "@/components/ui/icons";
import { useAuth } from "./AuthProvider";

interface NavItem {
  href: string;
  label: string;
  ownerOnly?: boolean;
}

const NAV: { heading: string; items: NavItem[] }[] = [
  {
    heading: "Shop",
    items: [
      { href: "/admin/products", label: "Products" },
      { href: "/admin/brands", label: "Brands" },
      { href: "/admin/categories", label: "Categories" },
    ],
  },
];

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { isOwner } = useAuth();
  return (
    <nav aria-label="Admin" className="flex flex-col gap-6">
      {NAV.map((group) => {
        const items = group.items.filter((i) => !i.ownerOnly || isOwner);
        if (items.length === 0) return null;
        return (
          <div key={group.heading}>
            <p className="label mb-2 px-3 text-muted">{group.heading}</p>
            <ul className="flex flex-col">
              {items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={isActive(pathname, item.href) ? "page" : undefined}
                    className={cn(
                      "block border-l-2 px-3 py-2 text-[15px] transition-colors",
                      isActive(pathname, item.href)
                        ? "border-terracotta bg-paper font-medium text-ink"
                        : "border-transparent text-ink-soft hover:bg-paper hover:text-ink",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

function UserBox() {
  const { me, logout } = useAuth();
  return (
    <div className="flex flex-col gap-2 border-t border-line pt-4">
      <p className="px-3 text-sm">
        <span className="block font-medium">{me.name}</span>
        <span className="text-muted">{me.role === "OWNER" ? "Owner" : "Editor"}</span>
      </p>
      <button type="button" onClick={() => void logout()} className="px-3 py-1 text-left text-sm text-ink-soft hover:text-terracotta">
        Log out
      </button>
    </div>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="no-print hidden border-r border-line bg-sand lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:justify-between lg:p-5">
        <div className="flex flex-col gap-8">
          <Link href="/admin" className="px-3 font-serif text-xl">
            Lately Lebanon
            <span className="label mt-1 block text-muted">Admin</span>
          </Link>
          <NavLinks />
        </div>
        <UserBox />
      </aside>

      <header className="no-print sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-sand px-4 lg:hidden">
        <Link href="/admin" className="font-serif text-lg">
          Lately Lebanon <span className="label text-muted">Admin</span>
        </Link>
        <button type="button" onClick={() => setMenuOpen(true)} className="-mr-2 flex items-center gap-2 p-2 text-sm" aria-label="Open menu">
          <MenuIcon className="size-6" />
        </button>
      </header>

      <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} title="Menu" side="left">
        <div className="flex h-full flex-col justify-between p-5">
          <NavLinks onNavigate={() => setMenuOpen(false)} />
          <UserBox />
        </div>
      </Drawer>

      <main id="main" className="min-w-0 bg-paper/40 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
        {children}
      </main>
    </div>
  );
}
