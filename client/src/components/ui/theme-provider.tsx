import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  actualTheme: "dark" | "light";
};

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
  actualTheme: "light",
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "dark",
  storageKey = "reweara-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );

  const [actualTheme, setActualTheme] = useState<"dark" | "light">("light");

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove("light", "dark");

    let computedTheme: "dark" | "light" = "light";

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      computedTheme = systemTheme;
    } else {
      computedTheme = theme;
    }

    root.classList.add(computedTheme);
    setActualTheme(computedTheme);

    // Update the global CSS rule for text color
    const style = document.createElement('style');
    style.id = 'theme-text-color';
    
    // Remove existing style if it exists
    const existingStyle = document.getElementById('theme-text-color');
    if (existingStyle) {
      existingStyle.remove();
    }

    if (computedTheme === "dark") {
      style.textContent = `
        body {
          background-color: hsl(0, 0%, 0%) !important;
          color: hsl(0, 0%, 95%) !important;
        }
        
        .bg-background {
          background-color: hsl(0, 0%, 0%) !important;
        }
        
        .text-primary {
          color: hsl(158, 82%, 48%) !important;
        }
        
        .bg-card {
          background-color: hsl(0, 0%, 1%) !important;
        }
        
        .bg-muted {
          background-color: hsl(0, 0%, 5%) !important;
        }

        ::selection {
          background-color: hsl(158, 82%, 48%);
          color: hsl(0, 0%, 0%);
        }
      `;
    } else {
      style.textContent = `
        body {
          background-color: hsl(40, 25%, 97%) !important;
          color: #0B5A3A !important;
        }
        
        .text-primary {
          color: #0B5A3A !important;
        }

        ::selection {
          background-color: #0B5A3A;
          color: white;
        }
      `;
    }

    document.head.appendChild(style);
  }, [theme]);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
    actualTheme,
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};