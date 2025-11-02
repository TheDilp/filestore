import { createLazyRoute } from "@tanstack/react-router";
import { useState } from "react";

import { Input } from "../components";

function FileBrowser() {
  const [, setState] = useState<FileList>();

  return (
    <div className="w-full  mx-auto h-full flex flex-col gap-y-4">
      <div className="w-full h-14 flex items-center justify-center">
        <h1 className="text-3xl font-bold">Filestore</h1>
      </div>
      <div className="container mx-auto flex-1">
        <div className="rounded-md border border-zinc-300 shadow-xs w-full p-4">
          <div className="h-10">
            <Input
              isMultiple
              accept="image/png, image/jpeg, image/gif, image/webp"
              onChange={(e) => {
                if (e.files) setState(e.files);
              }}
              name="files"
              value=""
              type="file"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export const fileBrowserLazyRoute = createLazyRoute("/browser")({
  component: FileBrowser,
});
