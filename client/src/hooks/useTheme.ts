import { useCallback, useEffect, useState } from "react";

export type ThemeMode = "light" | "dark" | "system";

const STORAGE_KEY = "voxly-theme";

function getSystemDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyTheme(mode: ThemeMode) {
  const dark =
    mode === "dark" || (mode === "system" && getSystemDark());
  document.documentElement.classList.toggle("dark", dark);
}

export function useTheme() {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "system";
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    return stored === "light" || stored === "dark" || stored === "system"
      ? stored
      : "system";
  });

  useEffect(() => {
    applyTheme(mode);
    localStorage.setItem(STORAGE_KEY, mode);

    if (mode !== "system") return;

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [mode]);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
  }, []);

  const cycle = useCallback(() => {
    setModeState((prev) =>
      prev === "light" ? "dark" : prev === "dark" ? "system" : "light"
    );
  }, []);

  return { mode, setMode, cycle };
}
