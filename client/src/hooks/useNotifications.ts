import { useAtomValue, useSetAtom } from "jotai";

import { notificationsAtom } from "../atoms";
import type { UINotificationType } from "../types";

export function useRemoveNotification() {
  const setNotifications = useSetAtom(notificationsAtom);
  function removeNotification(id: string) {
    setNotifications((prev) => {
      const idx = prev.findIndex((notification) => notification.id === id);
      if (idx !== undefined && idx > -1) return prev.toSpliced(idx, 1);

      return prev;
    });
  }
  return removeNotification;
}
export function useCreateNotification() {
  const setNotifications = useSetAtom(notificationsAtom);
  function createNotification(notification: UINotificationType) {
    setNotifications((prev) =>
      prev.concat({ ...notification, id: crypto.randomUUID() })
    );
  }
  return createNotification;
}
export function useNotifications() {
  return useAtomValue(notificationsAtom);
}
