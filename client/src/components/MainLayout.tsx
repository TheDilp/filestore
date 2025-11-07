import type { ReactNode } from "react";

import { useNotifications } from "../hooks";
import { Drawer } from "./Drawer";
import { Notification } from "./Notification";

type Props = {
  children: ReactNode;
};

export function MainLayout({ children }: Props) {
  const notifications = useNotifications();

  return (
    <main className="flex h-screen max-h-screen mx-auto flex-nowrap lg:container overflow-hidden overscroll-none">
      <Drawer />
      <div className="absolute top-4 right-4 flex flex-col gap-y-2">
        {notifications.map((notification) => (
          <Notification
            key={notification.id}
            icon={notification.icon}
            id={notification.id}
            timer={notification.timer}
            title={notification.title}
            variant={notification.variant}
          />
        ))}
      </div>
      {children}
    </main>
  );
}
