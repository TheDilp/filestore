export type valueof<T> = T[keyof T];

export type RelationKeys<T> = {
  [K in keyof T as K extends `relation__${infer R}` ? R : never]: T[K];
};

export type FieldKeys<
  T,
  Excluded extends "created_at" | "updated_at",
> = Exclude<
  {
    [K in keyof T]: K extends `relation__${string}` ? never : K;
  }[keyof T],
  Excluded
>;

export type FormattedEntity<T> = {
  [K in keyof T as K extends `relation__${infer Rest}` ? Rest : K]: T[K];
};

export type Nullable<T> = { [K in keyof T]: T[K] | null };

type HasRelations<T> = T extends { relations: unknown } ? true : false;

//* Generic type to create dot notation for nested fields
type CreateDotNotation<T, K extends keyof T> = T[K] extends
  | (infer U)[]
  | undefined
  ? U extends string
    ? `${string & K}.${U}`
    : never
  : never;

//* Generic type to extract nested relation fields with dot notation (only if relations exist)
export type NestedRelationFields<T> =
  HasRelations<T> extends true
    ? T extends { relations: Record<string, unknown> }
      ? {
          [K in keyof T["relations"]]: CreateDotNotation<T["relations"], K>;
        }[keyof T["relations"]]
      : never
    : never;
