import { atomWithReset } from "jotai/utils";
import type { infer as zodInfer } from "zod";

import type { FileSchema } from "../schemas";
import type { UINotificationType } from "../types";

export const notificationsAtom = atomWithReset<UINotificationType[]>([]);

export const drawerAtom = atomWithReset<{
  type: zodInfer<typeof FileSchema>["type"];
  title: string;
  data: {
    id: string;
    url?: string;
  };
} | null>(null);
