import { createLazyRoute, useParams } from "@tanstack/react-router";
import { Fragment, useRef, useState } from "react";
import type { infer as zodInfer } from "zod";

import {
  Breadcrumbs,
  Button,
  FileCard,
  FileRow,
  Input,
  Select,
} from "../components";
import { Icons } from "../enums";
import { useCreateNotification, useList, useUpload } from "../hooks";
import { FileSchema } from "../schemas";
import { fetchFunction, groupBy } from "../utils";
const sortOptions = [
  { id: "size", label: "Size", value: "size" },
  { id: "title", label: "Title", value: "title" },
  { id: "type", label: "Type", value: "type" },
  { id: "created_at", label: "Uploaded at", value: "created_at" },
];
const groupOptions: {
  id: string;
  label: string;
  value: "title" | "type" | null;
}[] = [
  { id: "type", label: "Type", value: "type" },
  { id: "none", label: "None", value: null },
];

async function createFolder(title: string, path: string, refetch: () => void) {
  const res = await fetchFunction({
    model: "files",
    action: "create",
    body: JSON.stringify({ title }),
    method: "POST",
    urlSuffix: "folder",
    searchParams: [
      ["path", path],
      ["is_public", true],
    ],
  });
  if (res.ok) refetch();
}

const fields: (keyof zodInfer<typeof FileSchema>)[] = [
  "id",
  "title",
  "type",
  "size",
  "createdAt",
];
const fieldString = fields.join("");
function FileBrowser() {
  const [files, setFiles] = useState<FileList>();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [sort, setSort] = useState<{
    field: keyof zodInfer<typeof FileSchema>;
    type: "asc" | "desc";
  }>({ field: "createdAt", type: "asc" });
  const createNotification = useCreateNotification();
  const [groupedBy, setGroupedBy] = useState<"type" | null>(null);
  const ref = useRef<HTMLInputElement>(null);
  const params = useParams({ from: "/browser/{-$path}" });
  const { data = [], refetch } = useList<zodInfer<typeof FileSchema>>(
    {
      queryKey: ["files", fieldString, sort.field, params?.path || ""],
      model: "files",
      fields,
      sort,
    },
    {
      searchParams: [["path", params?.path || ""]],
    }
  );

  const { mutate, isPending } = useUpload();
  const crumbs = (params.path || "")
    .split("/")
    .filter(Boolean)
    .map((crumb) => ({ id: crumb, title: crumb, path: crumb }));

  const grouped = groupedBy ? groupBy(data, groupedBy) : null;
  return (
    <div className="w-full mx-auto h-full flex flex-col gap-y-4 overflow-hidden">
      <div className="w-full h-14 flex items-center justify-center">
        <h1 className="text-3xl font-bold">Filestore</h1>
      </div>
      <div className="w-full px-6 flex flex-col gap-y-10 mx-auto flex-1 max-h-[calc(100%-120px)]">
        <div className="rounded-md border border-secondary w-full p-4 flex items-center flex-nowrap gap-x-2">
          <div className="h-10 grow">
            <Input
              ref={ref}
              isMultiple
              isDisabled={isPending}
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
              onClick={() =>
                mutate(
                  { files, path: params?.path },
                  {
                    onSuccess: () => {
                      if (ref.current) {
                        ref.current.value = "";
                        refetch();
                        createNotification({
                          title: "File(s) successfully uploaded.",
                          variant: "success",
                          icon: Icons.upload,
                        });
                      }
                    },
                  }
                )
              }
              title="Upload"
              variant="primary"
              isLoading={isPending}
              icon={Icons.upload}
            />
          </div>
          <div className="">
            <Button
              title="New folder"
              icon={Icons.folder}
              onClick={() => {
                const title = prompt("Enter folder name");
                if (title) createFolder(title, params.path || "", refetch);
              }}
            />
          </div>
        </div>
        <div>
          <Breadcrumbs items={crumbs} />
          <hr className="border-secondary" />
        </div>
        <div className="flex items-center justify-between max-sm:gap-y-8 max-sm:flex-col">
          <h2 className="text-2xl font-semibold max-sm:hidden">Your Files</h2>
          <div className="flex items-end gap-x-2">
            <div className="w-46">
              <Select
                options={sortOptions}
                onChange={(e) => {
                  setSort({
                    field: e.value as keyof zodInfer<typeof FileSchema>,
                    type: "asc",
                  });
                }}
                name="sort"
                value={sort.field}
                title="Sort"
                variant="secondary"
              />
            </div>
            <div className="w-30">
              <Select
                options={groupOptions}
                onChange={(e) => {
                  setGroupedBy(e.value as "type" | null);
                }}
                name="group"
                title="Group"
                value={groupedBy}
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
            {grouped
              ? Object.entries(grouped)
                  .sort((a, b) => {
                    if (a[0] > b[0]) return 1;
                    if (a[0] < b[0]) return -1;
                    return 0;
                  })
                  .map(([key, value]) => {
                    return (
                      <Fragment key={key}>
                        <h3 className="border-b border-secondary text-xl uppercase col-span-full">
                          {key}
                        </h3>
                        {value.map((item) => (
                          <FileCard
                            key={item.id}
                            id={item.id}
                            title={item.title}
                            createdAt={item.createdAt}
                            type={item.type}
                            size={item.size}
                          />
                        ))}
                      </Fragment>
                    );
                  })
              : data.map((item) => (
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
          <div
            className={`flex flex-col overflow-y-auto ${groupedBy ? "gap-y-4" : "divide-secondary divide-y"}`}
          >
            {grouped
              ? Object.entries(grouped)
                  .sort((a, b) => {
                    if (a[0] > b[0]) return 1;
                    if (a[0] < b[0]) return -1;
                    return 0;
                  })
                  .map(([key, value]) => {
                    return (
                      <div className="flex flex-col" key={key}>
                        <h3 className="border-b border-zinc-400 text-xl uppercase col-span-full">
                          {key}
                        </h3>
                        <div className="divide-y divide-secondary flex flex-col py-0.5">
                          {value.map((item) => (
                            <FileRow
                              key={item.id}
                              title={item.title}
                              createdAt={item.createdAt}
                              type={item.type}
                              size={item.size}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })
              : data.map((item) => (
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
