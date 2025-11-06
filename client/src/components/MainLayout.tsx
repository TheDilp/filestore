import {
  autoUpdate,
  useFloating,
  useTransitionStyles,
} from "@floating-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { useResetAtom } from "jotai/utils";
import type { ReactNode } from "react";

import { drawerAtom } from "../atoms";
import { Icons } from "../enums";
import { useNotifications } from "../hooks";
import { isText } from "../utils";
import { Button } from "./Button";
import { Notification } from "./Notification";

type Props = {
  children: ReactNode;
};

function Drawer() {
  const resetDrawer = useResetAtom(drawerAtom);
  const drawer = useAtomValue(drawerAtom);

  const { refs, context } = useFloating({
    placement: "right",
    transform: true,
    open: !!drawer,
    whileElementsMounted: autoUpdate,
  });
  const { styles } = useTransitionStyles(context, {
    initial: {
      position: "fixed",
      transform: "translateX(100%)",
      width: "10rem",
    },
    common: ({ side }) => ({
      position: "fixed",
      transformOrigin: {
        top: 0,
        bottom: 0,
        left: "100%",
        right: "0px",
      }[side],
    }),
  });

  const { data } = useQuery({
    queryKey: [drawer?.data?.id, drawer?.type, drawer?.title],
    queryFn: async () => {
      if (!drawer?.data.url) return;
      const res = await fetch(drawer.data.url, { method: "GET" });

      if (isText(drawer.type)) {
        const text = await res.text();
        return text;
      }

      return "";
    },
    enabled: drawer?.type !== "pdf",
  });
  return (
    <div
      className={`w-screen h-screen pointer-events-none left-0 transition-colors duration-500 absolute ${drawer ? "bg-black/80 " : "bg-transparent"} z-10`}
    >
      <div
        ref={refs.setFloating}
        style={{ ...styles, transitionDuration: "0.35s" }}
        className="h-screen w-[calc(50vw)]  max-lg:w-screen max-h-screen right-0 absolute pointer-events-auto rounded-l bg-white shadow"
      >
        <h2 className="text-3xl bg-white px-4 py-2 font-semibold border-b border-primary-highlight flex items-center justify-between">
          {drawer?.title}
          <div>
            <Button
              size="lg"
              iconSize={28}
              onClick={resetDrawer}
              icon={Icons.close}
              isOutline
              hasNoBorder
            />
          </div>
        </h2>
        <div className="p-4 max-h-[95%] overflow-y-auto ">
          {drawer?.type === "pdf" ? (
            <iframe
              className="w-full h-full"
              title={drawer.title}
              src={drawer.data.url}
            />
          ) : null}
          {data && drawer?.type === "json" ? (
            <pre>
              <code>{data}</code>
            </pre>
          ) : null}
          {data &&
          drawer?.type &&
          isText(drawer?.type) &&
          drawer?.type !== "json" ? (
            <p className="text-lg">{data}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
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
