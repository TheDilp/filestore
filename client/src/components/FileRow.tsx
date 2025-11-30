import { useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "@tanstack/react-router";
import { useSetAtom } from "jotai";
import { useRef, useState } from "react";
import type { infer as zodInfer } from "zod";

import { drawerAtom } from "../atoms";
import { Icons } from "../enums";
import { useCreateNotification } from "../hooks";
import type { FileSchema } from "../schemas";
import {
  fetchFunction,
  fileFetchFunction,
  formatDateTime,
  getFileSize,
  getIconColor,
  isAudio,
  isCode,
  isImage,
  isPreviewable,
  isText,
  isVideo,
} from "../utils";
import { Button } from "./Button";
import { Dropdown } from "./Dropdown";
import { Icon } from "./Icon";

type Props = Pick<
  zodInfer<typeof FileSchema>,
  "id" | "title" | "type" | "createdAt" | "size"
>;

export function FileRow({ id, title, type, createdAt, size }: Props) {
  const params = useParams({ from: "/browser/{-$path}" });
  const queryClient = useQueryClient();
  const openPreviewDrawer = useSetAtom(drawerAtom);
  const [preview, setPreview] = useState<string>("");
  const audioRef = useRef<HTMLAudioElement>(null);
  const createNotification = useCreateNotification();

  return (
    <Link
      disabled={type !== "folder"}
      to="/browser/{-$path}"
      params={{ path: `${params.path ? `${params.path}/` : ""}${title}` }}
    >
      <div
        className={`pl-2 pr-0 py-4 hover:bg-secondary-highlight dark:hover:bg-primary flex flex-col items-center group ${preview ? "h-fit" : "h-12"}`}
      >
        <div className="flex items-center h-full flex-nowrap gap-x-4 w-full">
          <div>
            <Icon icon={Icons[type]} color={getIconColor(type)} fontSize={22} />
          </div>
          <span>{title}</span>
          <span className="ml-auto text-sm text-primary-highlight font-light flex items-center gap-x-4 dark:text-white">
            <span>{getFileSize(size)}</span>
            <span className="text-xs">{formatDateTime(createdAt)}</span>
            <div className="flex items-center gap-x-4 w-0 group-hover:w-32 transition-(--fade-in-transition)">
              <div className="group-hover:w-8 group-hover:opacity-100 max-lg:opacity-100 max-lg:w-8 pointer-events-none max-lg:pointer-events-auto delay-100 group-hover:pointer-events-auto opacity-0 w-0 transition-(--fade-in-transition) duration-200">
                <Button
                  isDisabled={!isPreviewable(type)}
                  onClick={async (e) => {
                    e.preventDefault();
                    if (
                      isText(type) ||
                      isCode(type) ||
                      isVideo(type) ||
                      type === "pdf"
                    ) {
                      const res = await fetchFunction<string>({
                        model: "files",
                        id,
                        action: "read",
                        method: "GET",
                        urlSuffix: "link",
                      });

                      openPreviewDrawer({
                        title,
                        data: { id, url: res.data },
                        type,
                      });
                    } else {
                      if (preview) {
                        if (audioRef.current) audioRef.current.pause();
                        setPreview("");
                        return;
                      }

                      const res = await fetchFunction<string>({
                        model: "files",
                        id,
                        action: "read",
                        method: "GET",
                        urlSuffix: "link",
                      });
                      if (audioRef.current) audioRef.current.volume = 0.25;
                      setPreview(res.data);
                    }
                  }}
                  iconSize={20}
                  hasNoBorder
                  isOutline
                  icon={Icons.preview}
                />
              </div>
              <div className="group-hover:w-8 group-hover:opacity-100 max-lg:opacity-100 max-lg:w-8 pointer-events-none max-lg:pointer-events-auto delay-100 group-hover:pointer-events-auto opacity-0 w-0 transition-(--fade-in-transition) duration-200">
                <Button
                  iconSize={20}
                  onClick={async (e) => {
                    e.preventDefault();
                    const res = await fetchFunction<string>({
                      model: "files",
                      id,
                      action: "read",
                      method: "GET",
                      urlSuffix: "link",
                    });
                    const link = res.data;
                    window.navigator.clipboard.writeText(link);
                    createNotification({
                      title: "Link copied successfully.",
                      variant: "success",
                      icon: Icons.copy,
                    });
                  }}
                  hasNoBorder
                  isOutline
                  icon={Icons.copy}
                />
              </div>
              <div className="group-hover:w-8 group-hover:opacity-100 max-lg:opacity-100 max-lg:w-8 pointer-events-auto opacity-0 w-0 delay-100 transition-(--fade-in-transition) duration-100">
                <Dropdown
                  allowedPlacements={["left", "right"]}
                  items={[
                    {
                      id: "download",
                      title: "Download",
                      isHidden: type === "folder",
                      icon: Icons.download,
                      onClick: async () => {
                        const blob = await fileFetchFunction({
                          id,
                          searchParams: [["path", params.path || ""]],
                        });
                        const link = document.createElement("a");
                        link.href = URL.createObjectURL(blob);
                        link.download = title;
                        link.click();
                        URL.revokeObjectURL(link.href);
                        link.remove();
                      },
                    },
                    {
                      id: "share",
                      title: "Share",
                      isHidden: type === "folder",
                      icon: Icons.share,
                      onClick: undefined,
                    },
                    {
                      id: "delete",
                      title: "Delete",
                      icon: Icons.delete,
                      onClick: async () => {
                        await fetchFunction({
                          model: "files",
                          action: "delete",
                          method: "DELETE",
                          id,
                        });
                        queryClient.invalidateQueries({ queryKey: ["files"] });
                      },
                      iconColor: "red",
                    },
                  ]}
                >
                  <Button
                    onClick={(e) => e.preventDefault()}
                    hasNoBorder
                    isOutline
                    icon={Icons.menu}
                  />
                </Dropdown>
              </div>
            </div>
          </span>
        </div>

        <div
          className={`flex items-center max-h-96 h-fit overflow-y-auto p-8 justify-center flex-col ${preview ? "opacity-100 h-30 pointer-events-auto" : "opacity-0 h-0 pointer-events-none"} transition-[opacity,height] duration-300`}
        >
          {isImage(type) && preview ? (
            <img
              className={`object-contain w-full h-full ${preview ? "opacity-100" : "opacity-0"}`}
              src={preview}
              alt={title}
            />
          ) : null}
          {isAudio(type) && preview ? (
            <audio ref={audioRef} autoPlay={!!preview} controls src={preview} />
          ) : null}
        </div>
      </div>
    </Link>
  );
}
