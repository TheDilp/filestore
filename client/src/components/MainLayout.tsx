import type { ReactNode } from "react";

import { Icons } from "../enums";
import { useDarkMode, useNotifications } from "../hooks";
import { Button } from "./Button";
import { Drawer } from "./Drawer";
import { Notification } from "./Notification";

type Props = {
  children: ReactNode;
};

export function MainLayout({ children }: Props) {
  const notifications = useNotifications();
  const { mode, changeMode } = useDarkMode();
  return (
    <main className="flex h-screen max-h-screen mx-auto flex-col lg:container bg-white overflow-hidden overscroll-none dark:bg-primary-darkened">
      <div className="w-full h-14 flex items-center relative justify-center">
        <h1 className="text-3xl font-bold absolute">Filestore</h1>
        <div className="ml-auto right-0.5 relative">
          <Button
            hasNoBorder
            icon={mode === "dark" ? Icons.moon : Icons.sun}
            iconSize={28}
            isOutline
            onClick={() => changeMode(mode === "dark" ? "light" : "dark")}
          />
        </div>
      </div>
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
