import { createLazyRoute, useParams } from "@tanstack/react-router";
import { useState } from "react";
import type { infer as zodInfer } from "zod";

import { Button, FileCard, Input, Select } from "../components";
import { Icons } from "../enums";
import { useList } from "../hooks";
import { FileSchema } from "../schemas";
import { fetchFunction } from "../utils";
const sortOptions = [
  { id: "size", label: "Size", value: "size" },
  { id: "title", label: "Title", value: "title" },
  { id: "type", label: "Type", value: "type" },
  { id: "created_at", label: "Uploaded at", value: "created_at" },
];

function FileBrowser() {
  const [files, setFiles] = useState<FileList>();
  const [view, setView] = useState<"grid" | "list">("grid");
  const params = useParams({ from: "/browser/{-$path}" });

  const { data = [] } = useList<zodInfer<typeof FileSchema>>(
    {
      model: "files",
      fields: ["id", "title"],
    },
    {
      searchParams: [["path", params.path || "/"]],
    }
  );

  return (
    <div className="w-full mx-auto h-full flex flex-col gap-y-4">
      <div className="w-full h-14 flex items-center justify-center">
        <h1 className="text-3xl font-bold">Filestore</h1>
      </div>
      <div className="w-full px-6 flex flex-col gap-y-10 mx-auto flex-1">
        <div className="rounded-md border border-secondary w-full p-4 flex items-center flex-nowrap gap-x-4">
          <div className="h-10 grow">
            <Input
              isMultiple
              accept="image/*, audio/*, video/*"
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
              onClick={async () => {
                if (!files) return;
                const formData = new FormData();

                for (let index = 0; index < files.length; index++)
                  formData.append(files[index].name, files[index]);

                const res = await fetchFunction({
                  model: "files",
                  action: "upload",
                  body: formData,
                  method: "POST",
                  searchParams: new URLSearchParams([
                    ["path", params?.path || "/"],
                  ]),
                });
                if (res.ok) window.location.reload();
              }}
              title="Upload"
              variant="primary"
              icon={Icons.upload}
            />
          </div>
        </div>
        <hr className="border-secondary" />
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Your Files</h2>
          <div className="flex items-center gap-x-2">
            <div className="w-46">
              <Select
                options={sortOptions}
                onChange={() => {}}
                name="sort"
                value=""
                variant="secondary"
              />
            </div>

            <Button
              isOutline
              icon={Icons.sort}
              onClick={undefined}
              variant="secondary"
            />
            <Button
              isOutline={view !== "grid"}
              icon={Icons.grid}
              variant={view === "grid" ? "info" : "secondary"}
              onClick={() => setView("grid")}
            />
            <Button
              icon={Icons.list}
              isOutline={view !== "list"}
              variant={view === "list" ? "info" : "secondary"}
              onClick={() => setView("list")}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {data.map((item) => (
            <FileCard
              key={item.id}
              title={item.title}
              createdAt={item.createdAt}
              type={item.type}
              size={item.size}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export const fileBrowserLazyRoute = createLazyRoute("/browser/{-$path}")({
  component: FileBrowser,
});
