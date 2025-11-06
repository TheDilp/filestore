import type { infer as zodInfer } from "zod";

import type { FileSchema } from "../schemas";
import type { Variant } from "../types";

export function sentenceCase(field: string): string {
  const text =
    field?.replaceAll(/[_-]/g, " ")?.replace(/([A-Z])/g, " $1") || "";
  return `${text.charAt(0).toUpperCase()}${text.slice(1)}`.trim();
}

export function formatEnumForOptions(data?: string[]) {
  return (data || [])
    .toSorted((a, b) => {
      if (a > b) return 1;
      if (a < b) return -1;
      return 0;
    })
    .map((item) => ({ id: item, label: sentenceCase(item), value: item }));
}

export function camelCase(text: string): string {
  return text
    .replace(/[_\-\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ""))
    .replace(/^(.)/, (m) => m.toLowerCase());
}

export function snakecase(text: string): string {
  return text
    .replace(/([A-Z])/g, "_$1")
    .replace(/[\s-]+/g, "_")
    .toLowerCase();
}

export function getFileSize(size: number): string {
  if (size < 1000) return `${size} bytes`;
  if (size < 1_000_000_000) return `${(size / 1_000_000).toFixed(2)} MB`;
  if (size < 1_000_000_000_000)
    return `${(size / 1_000_000_000).toFixed(2)} GB`;
  if (size < 1_000_000_000_000_000)
    return `${(size / 1_000_000_000_000).toFixed(2)} TB`;
  return `${size} bytes`;
}

export function getIconColor(type: zodInfer<typeof FileSchema>["type"]) {
  switch (type) {
    case "doc":
    case "docx":
    case "txt":
    case "md":
    case "mdx":
      return "#2B579A";

    case "pdf":
      return "#E42121";

    case "xls":
    case "xlsx":
    case "csv":
    case "json":
    case "xml":
    case "yml":
    case "sql":
      return "#1E7145";

    case "png":
    case "jpg":
    case "jpeg":
    case "bmp":
    case "gif":
    case "webp":
    case "svg":
    case "heic":
    case "raw":
    case "tiff":
    case "psd":
      return "#E67E22";

    case "mp3":
    case "wav":
    case "ogg":
    case "aac":
    case "m4p":
      return "#9C27B0";

    case "mp4":
    case "mov":
    case "avi":
    case "webm":
      return "#0097A7";

    case "js":
    case "jsx":
    case "tsx":
    case "css":
    case "scss":
    case "sass":
    case "py":
    case "rb":
    case "php":
    case "sh":
    case "java":
    case "cs":
    case "html":
      return "#FDD835";

    case "ttf":
    case "otf":
    case "woff":
      return "#8D6E63";

    case "zip":
    case "rar":
      return "#607D8B";

    case "exe":
      return "#C62828";

    default:
      return "#9E9E9E";
  }
}

export function variantToHex(variant: Variant): string {
  switch (variant) {
    case "primary":
      return "#9ca3af";

    case "secondary":
      return "#d1d5db";
    case "info":
      return "#3b82f6";
    case "success":
      return "#16a34a";
    case "warning":
      return "#f97316";
    case "error":
      return "#dc2626";

    default:
      return "#d1d5db";
  }
}
