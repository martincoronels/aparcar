"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/store/themeStore";

export default function ThemeToggle() {
  const { tema, isHydrated, hidratar, alternar } = useThemeStore();

  useEffect(() => {
    hidratar();
  }, [hidratar]);

  if (!isHydrated) {
    // Placeholder del mismo tamaño para evitar un salto de layout mientras
    // se lee localStorage.
    return <div className="h-9 w-9" aria-hidden="true" />;
  }

  return (
    <button
      type="button"
      onClick={alternar}
      aria-label={tema === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      className="flex h-9 w-9 items-center justify-center rounded-lg text-ink/70 transition-colors hover:bg-ink/5"
    >
      {tema === "dark" ? "☀️" : "🌙"}
    </button>
  );
}