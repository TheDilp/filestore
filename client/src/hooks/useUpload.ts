import { useMutation } from "@tanstack/react-query";

import { fetchFunction } from "../utils";

async function uploadFiles({
  files,
  path,
}: {
  files: { file: File; name: string }[];
  path: string | undefined;
}) {
  if (!files) return;
  const formData = new FormData();

  for (let index = 0; index < files.length; index++)
    formData.append(`file${index}`, files[index].file, files[index].name);

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
  return useMutation({ mutationFn: uploadFiles });
}
