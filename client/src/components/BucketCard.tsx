import { Link } from "@tanstack/react-router";

import { Icons } from "../enums";
import { fetchFunction } from "../utils";
import { Button } from "./Button";
import { Icon } from "./Icon";

export function BucketCard() {
  return (
    <Link
      // params={{ path: `${params.path ? `${params.path}/` : ""}${title}` }}
      to="/browser/{-$path}"
    >
      <div className="border border-secondary dark:bg-primary p-4 rounded-md hover:shadow group h-28 transition-[shadow,height] duration-300 ease-in-out">
        <div className="flex flex-row items-center justify-between h-10">
          <div className="flex flex-1 flex-no-wrap justify-between max-w-full items-center gap-x-4">
            <h3 className="text-sm font-medium line-clamp-1">Bucket test</h3>
            <div>
              <Icon fontSize={32} icon={Icons.bucket} />
            </div>
          </div>

          <div className="group-hover:w-8 group-hover:opacity-100 max-lg:opacity-100 max-lg:w-8 pointer-events-none max-lg:pointer-events-auto group-hover:pointer-events-auto opacity-0 w-0 transition-(--fade-in-transition) duration-200">
            <Button
              hasNoBorder
              icon={Icons.menu}
              isOutline
              onClick={(e) => {
                e.preventDefault();
                fetchFunction({
                  model: "files",
                  action: "delete",
                  method: "DELETE",
                  id: "",
                });
                // queryClient.invalidateQueries({ queryKey: ["files"] });
              }}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}
