import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};
export function MainLayout({ children }: Props) {
  return (
    <main className="max-w-screen flex h-screen max-h-screen w-screen flex-nowrap overflow-hidden overscroll-none">
      <div className="h-[calc(100vh-4.5rem)] p-4">{children}</div>
    </main>
  );
}
