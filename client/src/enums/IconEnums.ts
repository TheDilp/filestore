export const Icons = {
  add: "ph:plus" as const,
  arrowDown: "lucide:chevron-down" as const,
  arrowLeft: "lucide:chevron-left" as const,
  arrowRight: "lucide:chevron-right" as const,
  arrowUp: "lucide:chevron-up" as const,
  dashboard: "clarity:dashboard-line" as const,
  expand: "ci:expand" as const,
  notification: "ph:bell" as const,
  search: "tabler:search" as const,
  tasks: "material-symbols:task-alt-rounded" as const,
  upload: "tabler:upload" as const,
  user: "lucide:user" as const,
  xlsx: "bi:filetype-xlsx" as const,
};

export type AvailableIcons = (typeof Icons)[keyof typeof Icons];
