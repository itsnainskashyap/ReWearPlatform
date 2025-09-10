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
  defaultTheme = "system",
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
        body, * {
          color: hsl(0, 0%, 98%) !important;
        }
        
        b, strong, 
        .font-bold, .font-semibold, .font-extrabold,
        [class*="font-bold"], [class*="font-semibold"], [class*="font-extrabold"] {
          color: hsl(158, 82%, 48%) !important;
          font-weight: 700;
        }
        
        h1, h2, h3, h4, h5, h6 {
          color: hsl(0, 0%, 98%) !important;
        }
        
        h1.font-bold, h2.font-bold, h3.font-bold,
        h4.font-bold, h5.font-bold, h6.font-bold {
          color: hsl(158, 82%, 48%) !important;
        }

        ::selection {
          background-color: hsl(158, 82%, 48%);
          color: hsl(240, 10%, 3.9%);
          font-weight: 700;
        }
        
        ::-moz-selection {
          background-color: hsl(158, 82%, 48%);
          color: hsl(240, 10%, 3.9%);
          font-weight: 700;
        }
      `;
    } else {
      style.textContent = `
        body, * {
          color: black !important;
        }
        
        b, strong, 
        .font-bold, .font-semibold, .font-extrabold,
        [class*="font-bold"], [class*="font-semibold"], [class*="font-extrabold"] {
          color: #0B5A3A !important;
          font-weight: 700;
        }
        
        h1, h2, h3, h4, h5, h6 {
          color: black !important;
        }
        
        h1.font-bold, h2.font-bold, h3.font-bold,
        h4.font-bold, h5.font-bold, h6.font-bold {
          color: #0B5A3A !important;
        }

        ::selection {
          background-color: #0B5A3A;
          color: white;
          font-weight: 700;
        }
        
        ::-moz-selection {
          background-color: #0B5A3A;
          color: white;
          font-weight: 700;
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