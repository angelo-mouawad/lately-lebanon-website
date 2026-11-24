"use client";

import type { ReactNode } from "react";
import { useAuth } from "./AuthProvider";
import { EmptyBlock } from "./ui";

/** Hides money and settings screens from editors. The API enforces the same rule. */
export function OwnerOnly({ children }: { children: ReactNode }) {
  const { isOwner } = useAuth();
  if (!isOwner) return <EmptyBlock title="Only the account owner can see this page." />;
  return <>{children}</>;
}
