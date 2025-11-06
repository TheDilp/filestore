export type RequestActionsType =
  | "create"
  | "read"
  | "list"
  | "update"
  | "delete"
  | "search"
  | "upload"
  | "download";
export type RequestMethodsType = "GET" | "POST" | "PATCH" | "DELETE";

export type RequestFilterOperators =
  | "eq"
  | "neq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "is"
  | "is not"
  | "in"
  | "not in"
  | "ilike";
export type RequestFilterType<T> = {
  id: string;
  field: keyof T;
  operator: RequestFilterOperators;
  value: string | number | string[] | number[] | null;
  // | RequestFilterType<T>;
};
export type RequestFilterBase<T> = {
  and?: RequestFilterType<T>[];
  or?: RequestFilterType<T>[];
};
export type RequestFilters<T> = RequestFilterBase<T>;
export type RequestPagination = {
  limit: number | null | undefined;
  page: number | null | undefined;
};
