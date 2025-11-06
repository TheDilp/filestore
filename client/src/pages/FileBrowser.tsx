import { createLazyRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import type { infer as zodInfer } from "zod";

import { Button, FileCard, FileRow, Input, Select } from "../components";
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
const groupOptions = [
  { id: "type", label: "Type", value: "type" },
  { id: "title", label: "Title", value: "title" },
];

function FileBrowser() {
  const [files, setFiles] = useState<FileList>();
  const [view, setView] = useState<"grid" | "list">("grid");

  const ref = useRef<HTMLInputElement>(null);

  const { data = [], refetch } = useList<zodInfer<typeof FileSchema>>({
    model: "files",
    fields: ["id", "title"],
  });

  async function uploadFiles() {
    if (!files) return;
    const formData = new FormData();

    for (let index = 0; index < files.length; index++)
      formData.append(`file${index}`, files[index], files[index].name);

    const res = await fetchFunction({
      model: "files",
      action: "upload",
      body: formData,
      method: "POST",
      searchParams: [
        ["path", ""],
        ["is_public", true],
      ],
    });
    if (res.ok && ref.current) {
      ref.current.value = "";
      refetch();
    }
  }

  return (
    <div className="w-full mx-auto h-full flex flex-col gap-y-4 overflow-hidden">
      <div className="w-full h-14 flex items-center justify-center">
        <h1 className="text-3xl font-bold">Filestore</h1>
      </div>
      <div className="w-full px-6 flex flex-col gap-y-10 mx-auto flex-1 max-h-[calc(100%-120px)]">
        <div className="rounded-md border border-secondary w-full p-4 flex items-center flex-nowrap gap-x-4">
          <div className="h-10 grow">
            <Input
              ref={ref}
              isMultiple
              accept={
                import.meta.env.VITE_ACCEPT_FILE_TYPES ||
                "image/*, audio/*, video/*"
              }
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
              onClick={uploadFiles}
              title="Upload"
              variant="primary"
              icon={Icons.upload}
            />
          </div>
        </div>
        <hr className="border-secondary" />
        <div className="flex items-center justify-between max-sm:gap-y-8 max-sm:flex-col">
          <h2 className="text-2xl font-semibold max-sm:hidden">Your Files</h2>
          <div className="flex items-end gap-x-2">
            <div className="w-46">
              <Select
                options={sortOptions}
                onChange={() => {}}
                name="sort"
                value=""
                title="Sort"
                variant="secondary"
              />
            </div>
            <div className="w-30">
              <Select
                options={groupOptions}
                onChange={() => {}}
                name="group"
                title="Group"
                value=""
                variant="secondary"
              />
            </div>

            <Button
              isOutline
              icon={Icons.sort}
              size="xl"
              onClick={undefined}
              variant="secondary"
            />
            <Button
              isOutline={view !== "grid"}
              size="xl"
              icon={Icons.grid}
              variant={view === "grid" ? "info" : "secondary"}
              onClick={() => setView("grid")}
            />
            <Button
              icon={Icons.list}
              size="xl"
              isOutline={view !== "list"}
              variant={view === "list" ? "info" : "secondary"}
              onClick={() => setView("list")}
            />
          </div>
        </div>
        {view === "grid" ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4 overflow-y-auto overflow-x-hidden grow content-start">
            {data.map((item) => (
              <FileCard
                key={item.id}
                id={item.id}
                title={item.title}
                createdAt={item.createdAt}
                type={item.type}
                size={item.size}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-secondary overflow-y-auto">
            {data.map((item) => (
              <FileRow
                key={item.id}
                title={item.title}
                createdAt={item.createdAt}
                type={item.type}
                size={item.size}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export const fileBrowserLazyRoute = createLazyRoute("/browser/{-$path}")({
  component: FileBrowser,
});
