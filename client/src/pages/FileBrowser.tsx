import { createLazyRoute } from "@tanstack/react-router";
import { useState } from "react";

import { Button, Input } from "../components";
import { Icons } from "../enums";

function FileBrowser() {
  const [files, setFiles] = useState<FileList>();

  return (
    <div className="w-full mx-auto h-full flex flex-col gap-y-4">
      <div className="w-full h-14 flex items-center justify-center">
        <h1 className="text-3xl font-bold">Filestore</h1>
      </div>
      <div className="container mx-auto flex-1">
        <div className="rounded-md border border-zinc-300 shadow-xs w-full p-4 flex items-center flex-nowrap gap-x-4">
          <div className="h-10 grow">
            <Input
              isMultiple
              accept="image/png, image/jpeg, image/gif, image/webp"
              onChange={(e) => {
                if (e.files) setFiles(e.files);
              }}
              name="files"
              value=""
              type="file"
            />
          </div>
          <div className="h-full flex items-center">
            <Button
              iconSize={16}
              iconPosition="left"
              isDisabled={!files?.length}
              onClick={undefined}
              title="Upload"
              variant="primary"
              icon={Icons.upload}
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
