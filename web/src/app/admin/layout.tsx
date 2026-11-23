import type { Metadata } from "next";
import { ToastProvider } from "@/components/admin/Toast";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Lately Lebanon Admin" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}
