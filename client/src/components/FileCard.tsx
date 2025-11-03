import type { infer as zodInfer } from "zod";

import { Icons } from "../enums";
import type { FileSchema } from "../schemas";
import { Button } from "./Button";
import { Icon } from "./Icon";

type Props = Pick<
  zodInfer<typeof FileSchema>,
  "title" | "type" | "createdAt" | "size"
>;

export function FileCard({ title, type, createdAt, size }: Props) {
  return (
    <div className="border border-secondary p-4 rounded-md hover:shadow transition-shadow group">
      <div className="flex flex-row items-center justify-between h-10">
        <div className="flex flex-no-wrap flex-1 justify-between items-center gap-x-4 ">
          <h3 className="text-sm font-medium truncate">{title}</h3>
          <div>
            <Icon icon={Icons[type]} fontSize={32} />
          </div>
        </div>
        <div className="group-hover:w-8 group-hover:opacity-100 pointer-events-auto opacity-0 w-0 transition-(--fade-in-transition) duration-100">
          <Button onClick={undefined} hasNoBorder isOutline icon={Icons.menu} />
        </div>
      </div>
      <div className="text-xs flex flex-col gap-y-0.5 text-zinc-400">
        <span>Size: {size} KB</span>
        <span>Uploaded: {createdAt}</span>
      </div>
    </div>
  );
}
