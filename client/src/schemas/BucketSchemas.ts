import { type infer as zodInfer, object, string, uuidv4 } from "zod";

export const BucketSchema = object({
  id: uuidv4(),
  title: string(),
  ownerId: uuidv4(),
});

export type BucketType = zodInfer<typeof BucketSchema>;
