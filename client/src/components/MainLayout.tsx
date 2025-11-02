import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};
export function MainLayout({ children }: Props) {
  return (
    <main className="flex h-screen max-h-screen mx-auto flex-nowrap lg:container overflow-hidden overscroll-none">
      {children}
    </main>
  );
}
