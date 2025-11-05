import { format as formatFn, parseISO } from "date-fns";
export function formatDateTime(
  value: string,
  format: string = import.meta.env.VITE_DEFAULT_DATE_TIME_FORMAT ||
    "dd/MM/yyyy HH:mm"
) {
  try {
    const parsed = parseISO(value.replace(/\[.*\]$/, ""));
    return formatFn(parsed, format);
  } catch (error) {
    console.error(error);
    return "";
  }
}
