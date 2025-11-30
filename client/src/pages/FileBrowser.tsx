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
import {
  useCreateNotification,
  useDarkMode,
  useDebounce,
  useList,
  useUpload,
} from "../hooks";
import { FileSchema } from "../schemas";
import { fetchFunction, getFileSize, groupBy } from "../utils";
const sortOptions = [
  { id: "size", label: "Size", value: "size" },
  { id: "title", label: "Title", value: "title" },
  { id: "type", label: "Type", value: "type" },
  { id: "createdAt", label: "Uploaded at", value: "createdAt" },
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
  const [files, setFiles] = useState<{ file: File; name: string }[]>([]);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [sort, setSort] = useState<{
    field: keyof zodInfer<typeof FileSchema>;
    type: "asc" | "desc";
  }>({ field: "createdAt", type: "asc" });
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const createNotification = useCreateNotification();
  const [groupedBy, setGroupedBy] = useState<"type" | null>(null);
  const ref = useRef<HTMLInputElement>(null);
  const params = useParams({ from: "/browser/{-$path}" });
  const { data = [], refetch } = useList<zodInfer<typeof FileSchema>>(
    {
      queryKey: [
        "files",
        fieldString,
        sort.field,
        sort.type,
        params?.path || "",
        debouncedSearch,
      ],
      model: "files",
      filters: debouncedSearch
        ? {
            and: [
              {
                id: "search",
                field: "title",
                value: `%${debouncedSearch}%`,
                operator: "ilike",
              },
            ],
          }
        : undefined,
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
  const { mode, changeMode } = useDarkMode();
  const grouped = groupedBy ? groupBy(data, groupedBy) : null;
  return (
    <div className="w-full mx-auto h-full flex flex-col gap-y-4 overflow-hidden">
      <div className="w-full h-14 flex items-center relative justify-center">
        <h1 className="text-3xl font-bold absolute">Filestore</h1>
        <div className="ml-auto right-0.5 relative">
          <Button
            onClick={() => changeMode(mode === "dark" ? "light" : "dark")}
            icon={mode === "dark" ? Icons.moon : Icons.sun}
            isOutline
            hasNoBorder
            iconSize={28}
          />
        </div>
      </div>
      <div className="w-full px-6 flex flex-col gap-y-10 mx-auto flex-1 max-h-[calc(100%-120px)]">
        <div className="rounded-md border border-secondary w-full p-4 flex flex-col gap-y-2">
          <div className="flex flex-nowrap items-center gap-x-2">
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
                  if (e.files)
                    setFiles((prev) =>
                      prev.concat(
                        Array.from(e.files || []).map((file) => ({
                          name: file.name,
                          file,
                        }))
                      )
                    );
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
                          setFiles([]);
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
            <div>
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

          {files && files.length ? (
            <ol className="pl-1.5 max-h-96 overflow-y-auto">
              {Array.from(files).map((file, idx) => (
                <li
                  className="py-1 flex items-center gap-x-8"
                  key={file.file.name + file.file.type}
                >
                  <div className="grow">
                    <Input
                      name="name"
                      value={file.name}
                      variant={file.name ? "secondary" : "error"}
                      helperText={
                        file?.name ? "" : "File name cannot be empty."
                      }
                      onChange={(e) => {
                        if (e.value)
                          setFiles((prev) => {
                            if (e.value) {
                              const temp = [...prev];
                              temp[idx].name = e.value;
                              return temp;
                            }
                            return prev;
                          });
                      }}
                    />
                  </div>
                  <span className="text-sm">{getFileSize(file.file.size)}</span>
                  <div className="ml-auto">
                    <Button
                      size="lg"
                      variant="error"
                      isOutline
                      icon={Icons.delete}
                      onClick={() => setFiles((prev) => prev.toSpliced(idx, 1))}
                    />
                  </div>
                </li>
              ))}
            </ol>
          ) : null}
        </div>
        <div>
          <Breadcrumbs items={crumbs} />
          <hr className="border-secondary" />
        </div>
        <div className="flex items-center justify-between max-sm:gap-y-8 max-sm:flex-col">
          <h2 className="text-2xl font-semibold max-sm:hidden">Your Files</h2>
          <div className="flex items-end gap-x-2">
            <div className="">
              <Input
                name="search"
                onChange={(e) => {
                  if (e.value !== null) setSearch(e.value);
                }}
                value={search}
                type="search"
                variant="secondary"
                placeholder="Search"
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
            <div className="w-46">
              <Select
                options={sortOptions}
                onChange={(e) => {
                  setSort({
                    field: e.value as keyof zodInfer<typeof FileSchema>,
                    type: sort.type,
                  });
                }}
                name="sort"
                value={sort.field}
                title="Sort"
                variant="secondary"
              />
            </div>

            <Button
              isOutline
              icon={
                sort.type === "asc" ? Icons.arrowUpSort : Icons.arrowDownSort
              }
              size="xl"
              onClick={() =>
                setSort((prev) => ({
                  ...prev,
                  type: prev.type === "asc" ? "desc" : "asc",
                }))
              }
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
            className={`flex flex-col overflow-y-auto ${groupedBy ? "gap-y-2 dark:gap-y-0" : "divide-secondary divide-y"}`}
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
                        <h3 className="border-b border-zinc-400 dark:border-secondary text-xl uppercase col-span-full">
                          {key}
                        </h3>
                        <div className="divide-y divide-secondary dark:divide-primary-highlight flex flex-col py-0.5">
                          {value.map((item) => (
                            <FileRow
                              id={item.id}
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
                    id={item.id}
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
