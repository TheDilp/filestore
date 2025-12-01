import { useMutation, type UseMutationOptions } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";

import type { FileForUpload } from "../types";
import { fetchFunction } from "../utils";

async function uploadFiles(
  {
    files,
  }: {
    files: FileForUpload[];
  },
  ctx: {
    meta: UseMutationOptions["meta"];
  }
) {
  if (!files) return;
  const formData = new FormData();
  const path = ctx?.meta?.path as string | undefined;
  for (let index = 0; index < files.length; index++) {
    formData.append(`file${index}`, files[index].file, files[index].name);
    formData.append(`file${index}.tags`, JSON.stringify(files[index].tags));
  }
  const res = await fetchFunction({
    model: "files",
    action: "upload",
    body: formData,
    method: "POST",
    searchParams: [
      ["path", path || ""],
      ["is_public", true],
      ["is_folder", true],
    ],
  });
  return res;
}

export function useUpload() {
  const params = useParams({ from: "/browser/{-$path}" });

  return useMutation({
    mutationKey: ["upload"],
    mutationFn: uploadFiles,
    meta: { path: params.path },
  });
}
