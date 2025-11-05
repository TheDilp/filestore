import type { infer as zodInfer } from "zod";

import { Icons } from "../enums";
import type { FileSchema } from "../schemas";
import { formatDateTime, getFileSize, getIconColor } from "../utils";
import { Button } from "./Button";
import { Icon } from "./Icon";

type Props = Pick<
  zodInfer<typeof FileSchema>,
  "title" | "type" | "createdAt" | "size"
>;

export function FileRow({ title, type, createdAt, size }: Props) {
  return (
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
            <Button
              onClick={undefined}
              hasNoBorder
              isOutline
              icon={Icons.menu}
            />
          </div>
        </span>
      </div>
    </div>
  );
}
