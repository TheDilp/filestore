import { createLazyRoute } from "@tanstack/react-router";
import { useState } from "react";

import { Button, FileCard, Input } from "../components";
import { Icons } from "../enums";

function FileBrowser() {
  const [files, setFiles] = useState<FileList>();

  return (
    <div className="w-full mx-auto h-full flex flex-col gap-y-4">
      <div className="w-full h-14 flex items-center justify-center">
        <h1 className="text-3xl font-bold">Filestore</h1>
      </div>
      <div className="w-full px-6 flex flex-col gap-y-8 mx-auto flex-1">
        <div className="rounded-md border border-secondary w-full p-4 flex items-center flex-nowrap gap-x-4">
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
        <hr className="border-secondary" />
        <h2 className="text-2xl font-semibold">Your Files</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          <FileCard />
        </div>
      </div>
    </div>
  );
}

export const fileBrowserLazyRoute = createLazyRoute("/browser")({
  component: FileBrowser,
});
