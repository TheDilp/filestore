import type { ReactNode } from "react";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="max-w-screen flex h-screen max-h-screen w-screen items-center justify-center overflow-hidden">
      {children}
    </main>
  );
}
