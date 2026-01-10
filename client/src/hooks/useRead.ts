import {
  type QueryKey,
  useQuery,
  type UseQueryOptions,
} from "@tanstack/react-query";

import type { Models } from "../enums";
import type { FormattedEntity } from "../types";
import { fetchFunction, getSearchParams } from "../utils";

export type useReadProps<F> = {
  id: string;
  model: (typeof Models)[number];
  fields: (keyof FormattedEntity<F>)[];
  relations?: F extends { relations: infer R } ? R : never;
  queryKey?: QueryKey;
};

export function useRead<F, O = F>(
  { id, model, fields, relations, queryKey }: useReadProps<F>,
  options?: Pick<
    UseQueryOptions<F, Error, O>,
    "enabled" | "staleTime" | "select"
  > & { urlPrefix?: string; urlSuffix?: string },
) {
  const searchParams = getSearchParams<F>({ fields, relations });

  return useQuery<F, Error, O>({
    queryKey:
      queryKey ||
      [model, "read", id, fields, relations, options?.urlSuffix || ""].filter(
        Boolean,
      ),
    queryFn: async () => {
      const res = await fetchFunction<F>({
        method: "GET",
        action: "read",
        model,
        id,
        searchParams,
      });
      return res.data;
    },
    enabled: !!(options?.enabled ?? true),
    staleTime: options?.staleTime,
    select: options?.select,
  });
}
