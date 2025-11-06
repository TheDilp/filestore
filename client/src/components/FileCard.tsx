import { useParams } from "@tanstack/react-router";
import type { infer as zodInfer } from "zod";

import { Icons } from "../enums";
import type { FileSchema } from "../schemas";
import {
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

export function FileCard({ id, title, type, createdAt, size }: Props) {
  const params = useParams({ from: "/browser/{-$path}" });

  return (
    <div className="border border-secondary p-4 rounded-md hover:shadow transition-shadow group max-h-28">
      <div className="flex flex-row items-center justify-between h-10">
        <div className="flex flex-1 flex-no-wrap justify-between max-w-full items-center gap-x-4">
          <h3 className="text-sm font-medium line-clamp-1">{title}</h3>
          <div>
            <Icon icon={Icons[type]} color={getIconColor(type)} fontSize={32} />
          </div>
        </div>
        <div className="group-hover:w-8 group-hover:opacity-100 max-lg:opacity-100 max-lg:w-8 pointer-events-auto opacity-0 w-0 transition-(--fade-in-transition) duration-100">
          <Dropdown
            items={[
              {
                id: "download",
                title: "Download",
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
                icon: Icons.share,
                onClick: () => {},
              },
              {
                id: "delete",
                title: "Delete",
                icon: Icons.delete,
                onClick: () => {},
                iconColor: "red",
              },
            ]}
          >
            <Button
              onClick={undefined}
              hasNoBorder
              isOutline
              icon={Icons.menu}
            />
          </Dropdown>
        </div>
      </div>
      <div className="text-xs flex flex-col gap-y-0.5 text-zinc-400">
        <span>Size: {getFileSize(size)}</span>
        <span>Uploaded: {formatDateTime(createdAt)}</span>
      </div>
    </div>
  );
}
