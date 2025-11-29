import { useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "@tanstack/react-router";
import type { infer as zodInfer } from "zod";

import { Icons } from "../enums";
import type { FileSchema } from "../schemas";
import {
  fetchFunction,
  fileFetchFunction,
  formatDateTime,
  getFileSize,
  getIconColor,
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

  return (
    <Link
      disabled={type !== "folder"}
      to="/browser/{-$path}"
      params={{ path: `${params.path ? `${params.path}/` : ""}${title}` }}
    >
      <div className="h-12 pl-2 pr-4 py-4 hover:bg-secondary-highlight flex items-center group">
        <div className="flex items-center flex-nowrap gap-x-4 w-full">
          <div>
            <Icon icon={Icons[type]} color={getIconColor(type)} fontSize={22} />
          </div>
          <span>{title}</span>
          <span className="ml-auto text-sm text-primary-highlight font-light flex items-center gap-x-4">
            <span>{getFileSize(size)}</span>
            <span className="text-xs">{formatDateTime(createdAt)}</span>
            <div className="group-hover:w-8 group-hover:opacity-100 max-lg:opacity-100 max-lg:w-8 pointer-events-auto opacity-0 w-0 transition-(--fade-in-transition) duration-100">
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
          </span>
        </div>
      </div>
    </Link>
  );
}
