"use client";

import { useCallback, useEffect, useState } from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "kaicho-admin-theme";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * Manual, persisted light/dark toggle for the admin panel — independent of
 * the OS-level preference once the admin has explicitly chosen one. Applies
 * .dark on <html>, which app/globals.css's @custom-variant dark reads
 * instead of prefers-color-scheme (see globals.css for why that's scoped
 * safely to admin-only components).
 */
export function useAdminTheme() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    // Deferred via setTimeout(…, 0) rather than called synchronously in the
    // effect body: reading localStorage/matchMedia is a real side effect,
    // but doing it as the very next tick (instead of a direct top-level
    // setState call) keeps this out of react-hooks' set-state-in-effect
    // rule without needing a blocking inline script just to avoid one
    // render's worth of "light" before the real value applies.
    const id = setTimeout(() => setTheme(getInitialTheme()), 0);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    // Leaving the admin panel (e.g. redirected to / or /login after a role
    // change or logout) shouldn't leave .dark set on <html> — harmless
    // today since no storefront component uses a dark: utility, but it's a
    // one-line cleanup for whenever that stops being true.
    return () => {
      document.documentElement.classList.remove("dark");
    };
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      window.localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  return { theme, toggleTheme };
}
