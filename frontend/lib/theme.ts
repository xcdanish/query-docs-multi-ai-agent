"use client";
import { useState, useEffect } from "react";

function getInitialTheme() {
    if (typeof window !== "undefined") {
        const stored = localStorage.getItem("qd-theme");
        if (stored) {
            return stored === "dark";
        }
    }
    return true; // Default to dark theme
}

export function useTheme() {
    const [isDark, setIsDark] = useState(getInitialTheme);

    useEffect(() => {
        document.documentElement.classList.toggle("dark", isDark);
    }, [isDark]);

    function toggle() {
        const next = !isDark;
        setIsDark(next);
        localStorage.setItem("qd-theme", next ? "dark" : "light");
    }

    return { isDark, toggle };
}
