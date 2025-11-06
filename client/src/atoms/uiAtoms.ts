import { atomWithReset } from "jotai/utils";

import type { UINotificationType } from "../types";

export const notificationsAtom = atomWithReset<UINotificationType[]>([]);
