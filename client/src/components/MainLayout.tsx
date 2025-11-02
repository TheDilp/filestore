import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};
export function MainLayout({ children }: Props) {
  return (
    <main className="max-w-screen flex h-screen max-h-screen w-screen flex-nowrap py-4 overflow-hidden overscroll-none">
      {children}
    </main>
  );
}
