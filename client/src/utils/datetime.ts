import { format as formatFn, parseISO } from "date-fns";
export function formatDateTime(value: string) {
  try {
    const parsed = parseISO(value.replace(/\[.*\]$/, ""));
    return formatFn(
      parsed,
      import.meta.env.VITE_DEFAULT_DATE_TIME_FORMAT || "dd/MM/yyyy HH:mm"
    );
  } catch (error) {
    console.error(error);
    return "";
  }
}
