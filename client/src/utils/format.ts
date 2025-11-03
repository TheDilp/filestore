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
