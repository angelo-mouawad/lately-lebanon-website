import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        {/* eslint-disable-next-line @next/next/no-img-element -- small static logo */}
        <img src="/brand/lately-lebanon-logo-stacked.png" alt="Lately Lebanon, a curated marketplace" width={916} height={576} className="h-auto w-48" />
        <p className="label mt-4 mb-8 text-muted">Admin</p>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
