import { atomWithReset } from "jotai/utils";

import type { BaseAuthCallbackType } from "../types";
export const UserAtom = atomWithReset<BaseAuthCallbackType["user"] | null>(
  null
);
