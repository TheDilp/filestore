import ky, { type SearchParamsOption } from "ky";

import type { Models } from "../enums";
import type { RequestActionsType, RequestMethodsType } from "../types";
import type { ResponseDataType } from "../types/BaseResponseTypes";

type Props = {
  model: (typeof Models)[number];
  action: RequestActionsType;
  method: RequestMethodsType;
  body?: string | FormData;
  id?: string;
  headers?: Record<string, string>;
  searchParams?: SearchParamsOption;
  retry?: number;
  urlSuffix?: string;
};

export async function authFetchFunction<T>({
  url,
  method,
  body,
  headers,
  retry,
  searchParams,
}: Pick<Props, "method" | "body" | "headers" | "searchParams" | "retry"> & {
  url: string;
}) {
  try {
    const res = await ky<ResponseDataType<T>>(
      `${import.meta.env.VITE_SERVER_URL}/auth/${url}`,
      {
        method,
        body,
        searchParams,
        credentials: "include",
        throwHttpErrors: false,
        retry: retry ?? 0,
        headers:
          typeof body === "string"
            ? {
                ...(headers || {}),
                "Content-Type": "application/json",
              }
            : headers,
      },
    );
    return await res.json();
  } catch (error) {
    console.error(error);
    return { data: null, ok: false, error: "Network error" };
  }
}

export async function fetchFunction<T>({
  model,
  action,
  method,
  body,
  headers,
  id,
  searchParams,
  urlSuffix,
}: Props) {
  const res = await ky<ResponseDataType<T>>(
    `${import.meta.env.VITE_SERVER_URL}/api/v1/${model}/${action}${id ? `/${id}` : ""}${urlSuffix ? `/${urlSuffix}` : ""}`,
    {
      method,
      timeout: 10 * 60 * 1000,
      body,
      credentials: "include",
      searchParams,
      headers:
        typeof body === "string"
          ? {
              ...(headers || {}),
              "Content-Type": "application/json",
            }
          : headers,
    },
  );

  return await res.json();
}

export async function fetchEnumFunction<T>({ model }: Pick<Props, "model">) {
  const res = await ky<ResponseDataType<T>>(
    `${import.meta.env.VITE_SERVER_URL}/api/v1/enums/${model}`,
    {
      credentials: "include",
    },
  );

  return await res.json();
}

export async function fileFetchFunction({
  id,
  searchParams,
}: Pick<Props, "searchParams"> & { id: string }) {
  const res = await ky(
    `${import.meta.env.VITE_SERVER_URL}/api/v1/files/download/${id}`,
    {
      method: "GET",
      credentials: "include",
      searchParams,
    },
  );

  return await res.blob();
}
