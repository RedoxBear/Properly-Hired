import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const ThemeContext = createContext({ theme: "light", setTheme: () => {}, resolvedTheme: "light" });

export function useTheme() {
    return useContext(ThemeContext);
}

export function ThemeProvider({ children, defaultTheme = "light", attribute = "class" }) {
    const [theme, setThemeState] = useState(() => {
        try {
            return localStorage.getItem("app-theme") || defaultTheme;
        } catch {
            return defaultTheme;
        }
    });

    const resolvedTheme = theme === "system"
        ? (window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light")
        : theme;

    const setTheme = useCallback((newTheme) => {
        setThemeState(newTheme);
        try {
            localStorage.setItem("app-theme", newTheme);
        } catch {}
    }, []);

    useEffect(() => {
        const root = document.documentElement;
        root.classList.remove("light", "dark");
        root.classList.add(resolvedTheme);
    }, [resolvedTheme]);

    useEffect(() => {
        if (theme !== "system") return;
        const mq = window.matchMedia("(prefers-color-scheme: dark)");
        const handler = () => setThemeState("system"); // triggers re-render to recalc resolvedTheme
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}