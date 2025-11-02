import type { infer as zodInfer } from "zod";

import type { LoginSchema } from "../schemas";

export type BaseAuthCallbackType = {
  user: zodInfer<typeof LoginSchema>;
};
