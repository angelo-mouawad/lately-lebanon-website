import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <p className="font-serif text-3xl">Lately Lebanon</p>
        <p className="label mt-1 mb-8 text-muted">Admin</p>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
