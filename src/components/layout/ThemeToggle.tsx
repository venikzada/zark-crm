"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    // Evitar hydration mismatch
    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className={cn("w-16 h-9 rounded-full bg-zinc-800/20", className)} />;
    }

    const isDark = theme === "dark";

    return (
        <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className={cn(
                "relative inline-flex h-9 w-16 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isDark ? "bg-zinc-800" : "bg-zinc-200",
                className
            )}
            aria-label="Toggle theme"
        >
            <span
                className={cn(
                    "flex items-center justify-center h-7 w-7 rounded-full bg-white shadow-sm transition-transform duration-300 ease-in-out",
                    isDark
                        ? "translate-x-8 bg-zinc-950 text-zinc-100"
                        : "translate-x-1 text-zinc-900"
                )}
            >
                {isDark ? (
                    <Moon className="h-4 w-4 fill-current" />
                ) : (
                    <Sun className="h-4 w-4 fill-current" />
                )}
            </span>
        </button>
    );
}
