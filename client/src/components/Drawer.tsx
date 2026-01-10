import {
  autoUpdate,
  useFloating,
  useTransitionStyles,
} from "@floating-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { useResetAtom } from "jotai/utils";
import SyntaxHighlighter from "react-syntax-highlighter";
import { dracula } from "react-syntax-highlighter/dist/esm/styles/hljs";

import { drawerAtom } from "../atoms";
import { Icons } from "../enums";
import { getHighlightLang, isCode, isText, isVideo } from "../utils";
import { Button } from "./Button";

export function Drawer() {
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

      if (isText(drawer.type) || isCode(drawer.type)) {
        const text = await res.text();
        return text;
      }

      return "";
    },
    enabled: drawer?.type !== "pdf" && !isVideo(drawer?.type || "mp4"),
  });

  return (
    <div
      className={`w-screen h-screen pointer-events-none left-0 transition-colors duration-500 absolute ${drawer ? "bg-black/80 " : "bg-transparent"} z-10`}
    >
      <div
        ref={refs.setFloating}
        className="h-screen w-[calc(50vw)]  max-lg:w-screen max-h-screen right-0 absolute pointer-events-auto rounded-l bg-white dark:bg-primary-darkened shadow"
        style={{ ...styles, transitionDuration: "0.35s" }}
      >
        <h2 className="text-3xl bg-white dark:bg-primary-darkened dark:text-white px-4 py-2 font-semibold border-b border-primary-highlight flex items-center justify-between">
          {drawer?.title}
          <div>
            <Button
              hasNoBorder
              icon={Icons.close}
              iconSize={28}
              isOutline
              onClick={resetDrawer}
              size="lg"
            />
          </div>
        </h2>
        <div className="p-4 max-h-[95%] overflow-y-auto h-[95%]">
          {drawer?.type === "pdf" ? (
            <iframe
              className="w-full h-full"
              src={drawer.data.url}
              title={drawer.title}
            />
          ) : null}
          {data && drawer?.type && isCode(drawer?.type) ? (
            <SyntaxHighlighter
              language={getHighlightLang(drawer?.type)}
              style={dracula}
            >
              {data}
            </SyntaxHighlighter>
          ) : null}
          {data &&
          drawer?.type &&
          isText(drawer?.type) &&
          !isCode(drawer?.type) ? (
            <p className="text-lg">{data}</p>
          ) : null}
          {drawer?.type && isVideo(drawer?.type) ? (
            <video className="w-full h-full" controls src={drawer?.data?.url} />
          ) : null}
        </div>
      </div>
    </div>
  );
}
