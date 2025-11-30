import { useEffect, useState } from "react";

export function useDarkMode() {
  const [mode, setMode] = useState(localStorage.getItem("mode") || "light");

  useEffect(() => {
    if (mode === "dark") document.body.classList.add("dark");
    else document.body.classList.remove("dark");
    localStorage.setItem("mode", mode);
  }, [mode]);

  return {
    mode,
    changeMode: (mode: "dark" | "light") => setMode(mode),
  };
}
