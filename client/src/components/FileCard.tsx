import { Icons } from "../enums";
import { Icon } from "./Icon";

export function FileCard() {
  return (
    <div className="border border-secondary p-4 rounded-md hover:shadow transition-shadow">
      <div className="flex flex-row items-center justify-between h-10">
        <h3 className="text-sm font-medium">Budget.xlsx</h3>
        <Icon icon={Icons.xlsx} fontSize={32} />
      </div>
      <div className="text-xs flex flex-col gap-y-0.5 text-zinc-400">
        <span>Size: 488.28 KB</span>
        <span>Uploaded: 23.1.2025.</span>
      </div>
    </div>
  );
}
