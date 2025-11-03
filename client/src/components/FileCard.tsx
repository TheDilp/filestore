import type { infer as zodInfer } from "zod";

import { Icons } from "../enums";
import type { FileSchema } from "../schemas";
import { Icon } from "./Icon";

type Props = Pick<
  zodInfer<typeof FileSchema>,
  "title" | "type" | "createdAt" | "size"
>;

export function FileCard({ title, type, createdAt, size }: Props) {
  return (
    <div className="border border-secondary p-4 rounded-md hover:shadow transition-shadow">
      <div className="flex flex-row items-center justify-between gap-x-4 h-10">
        <h3 className="text-sm font-medium truncate">{title}</h3>
        <div>
          <Icon icon={Icons[type]} fontSize={32} />
        </div>
      </div>
      <div className="text-xs flex flex-col gap-y-0.5 text-zinc-400">
        <span>Size: {size} KB</span>
        <span>Uploaded: {createdAt}</span>
      </div>
    </div>
  );
}
