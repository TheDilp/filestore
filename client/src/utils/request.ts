import type {
  FormattedEntity,
  RequestFilters,
  RequestPagination,
} from "../types";
import { snakecase } from "./format";

export function getSearchParams<F>({
  fields,
  filters,
  sort,
  relations,
  pagination,
}: {
  fields: (keyof FormattedEntity<F>)[];
  filters?: RequestFilters<F>;
  sort?: { field: keyof FormattedEntity<F>; type: "asc" | "desc" };
  relations?: F extends { relations: infer R } ? R : never;
  pagination?: RequestPagination;
}) {
  const searchParams = new URLSearchParams();

  searchParams.append(
    "fields",
    (fields || [])
      .map((f) => (typeof f === "string" ? snakecase(f) : f))
      .join(",")
  );
  if (filters) searchParams.append("filters", JSON.stringify(filters));

  if (relations) searchParams.append("relations", JSON.stringify(relations));

  if (pagination) {
    searchParams.append("limit", (pagination.limit || 30).toString());
    searchParams.append("page", (pagination.page || 0)?.toString());
  }
  if (sort) {
    const sortFieldComponents = String(sort.field).split(".");
    if (sortFieldComponents.length === 2)
      searchParams.append(
        "sortField",
        `${sortFieldComponents[0]}.${snakecase(String(sortFieldComponents[1]))}`
      );
    else
      searchParams.append(
        "sortField",
        snakecase(String(sortFieldComponents[0]))
      );

    searchParams.append("sortType", snakecase(sort.type));
  }

  return searchParams;
}
