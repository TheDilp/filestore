import { useEffect, useState } from "react";

export function useDebounce<T>(state: T, debounce: number = 500) {
  const [debouncedValue, setDebouncedValue] = useState(state);
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(state);
    }, debounce);

    return () => {
      clearTimeout(timer);
    };
  }, [state]);

  return debouncedValue;
}
