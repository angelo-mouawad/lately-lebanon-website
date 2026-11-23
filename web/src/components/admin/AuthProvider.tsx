"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { AdminMe } from "@latelylebanon/shared";
import { adminFetch, setAdminSession } from "@/lib/admin-api";
import { Skeleton } from "@/components/ui/Skeleton";

interface AuthValue {
  me: AdminMe;
  isOwner: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [me, setMe] = useState<AdminMe | null>(null);

  const toLogin = useCallback(() => {
    router.replace(`/admin/login?next=${encodeURIComponent(window.location.pathname)}`);
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    setAdminSession("", toLogin);
    adminFetch<AdminMe>("/auth/me")
      .then((user) => {
        if (cancelled) return;
        setAdminSession(user.csrfToken, toLogin);
        setMe(user);
      })
      .catch(() => {
        if (!cancelled) toLogin();
      });
    return () => {
      cancelled = true;
    };
  }, [toLogin]);

  const logout = useCallback(async () => {
    await adminFetch("/auth/logout", { method: "POST" }).catch(() => undefined);
    router.replace("/admin/login");
  }, [router]);

  if (!me) {
    return (
      <div className="mx-auto flex max-w-5xl flex-col gap-4 p-6" aria-busy="true" aria-label="Loading">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ me, isOwner: me.role === "OWNER", logout }}>
      {children}
    </AuthContext.Provider>
  );
}
