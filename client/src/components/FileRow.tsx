import type { infer as zodInfer } from "zod";

import { Icons } from "../enums";
import type { FileSchema } from "../schemas";
import { getFileSize, getIconColor } from "../utils";
import { Icon } from "./Icon";

type Props = Pick<
  zodInfer<typeof FileSchema>,
  "title" | "type" | "createdAt" | "size"
>;

export function FileRow({ title, type, createdAt, size }: Props) {
  return (
    <div className="h-12 px-2 py-4 hover:bg-secondary-highlight flex items-center">
      <div className="flex items-center flex-nowrap gap-x-4 w-full">
        <div>
          <Icon icon={Icons[type]} color={getIconColor(type)} fontSize={22} />
        </div>
        <span>{title}</span>
        <span className="ml-auto text-sm text-primary-highlight font-light">
          <span>{getFileSize(size)}</span>
          <span>{createdAt}</span>
        </span>
      </div>
    </div>
  );
}
