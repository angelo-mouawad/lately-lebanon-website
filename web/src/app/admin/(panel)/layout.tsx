import { AdminShell } from "@/components/admin/AdminShell";
import { AuthProvider } from "@/components/admin/AuthProvider";

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AdminShell>{children}</AdminShell>
    </AuthProvider>
  );
}
