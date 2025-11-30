import { useEffect, useState } from "react";

export function useDarkMode() {
  const [mode, setMode] = useState("light");

  useEffect(() => {
    if (mode === "dark") document.body.classList.add("dark");
    else document.body.classList.remove("dark");
  }, [mode]);

  return {
    mode,
    changeMode: (mode: "dark" | "light") => setMode(mode),
  };
}
