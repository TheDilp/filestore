import { useQuery, type UseQueryOptions } from "@tanstack/react-query";

import { Models } from "../enums";
import type {
  FormattedEntity,
  RequestFilters,
  RequestPagination,
} from "../types";
import { fetchFunction, getSearchParams } from "../utils";

export type useListProps<F> = {
  model: (typeof Models)[number];
  fields: (keyof FormattedEntity<F>)[];
  filters?: RequestFilters<F>;
  sort?: { field: keyof FormattedEntity<F>; type: "asc" | "desc" };
  placeholderData?: F[];
  isArchived?: boolean;
  pagination?: RequestPagination;
  relations?: F extends { relations: infer R } ? R : never;
  queryKey?: (string | number)[];
};

export function useList<F extends Record<string, unknown>, O = F>(
  {
    model,
    fields,
    filters,
    queryKey,
    pagination,
    placeholderData = [],
    sort,
    relations,
    isArchived,
  }: useListProps<F>,
  options?: Pick<
    UseQueryOptions<F[], Error, O[]>,
    "enabled" | "placeholderData" | "staleTime" | "select"
  > & {
    urlSuffix?: string;
    urlPrefix?: string;
    searchParams?: string[][];
  },
) {
  const searchParams = getSearchParams<F>({
    fields,
    filters,
    sort,
    relations,
    pagination,
  });

  if (options?.searchParams && options?.searchParams?.length)
    for (let index = 0; index < options.searchParams.length; index++)
      if (
        options?.searchParams?.[index]?.[0] &&
        options?.searchParams?.[index]?.[1]
      )
        searchParams.append(
          options?.searchParams?.[index]?.[0] || "",
          options?.searchParams?.[index]?.[1] || "",
        );

  return useQuery<F[], Error, O[]>({
    queryKey: (
      queryKey || [
        model,
        "list",
        fields,
        filters,
        sort,
        pagination?.limit,
        pagination?.page,
        isArchived,
        options?.urlSuffix || "",
      ]
    ).filter((i) => i !== null && i !== undefined),
    queryFn: async () => {
      const res = await fetchFunction<F[]>({
        method: "GET",
        model,
        searchParams,
        action: "list",

        // userReset: reset,
        // urlPrefix: options?.urlPrefix,
        // urlSuffix: `list${options?.urlSuffix ? `/${options?.urlSuffix}` : ""}`,
      });
      return res.data;
    },
    placeholderData,
    enabled: !!(options?.enabled ?? true),
    staleTime: options?.staleTime,
    select: options?.select,
  });
}
