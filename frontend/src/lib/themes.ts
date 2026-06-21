// Live theming: Tailwind v4 brand-* utilities resolve to var(--color-brand-*),
// so overriding those custom properties on :root recolors the whole app.

export interface Theme {
  name: string;
  swatch: string; // representative color for the picker
  scale: string[]; // 50,100,...,900
}

export const THEMES: Theme[] = [
  {
    name: "Emerald",
    swatch: "#059669",
    scale: ["#ecfdf6", "#d1fae5", "#a7f3d0", "#6ee7b7", "#34d399", "#10b981", "#059669", "#047857", "#065f46", "#064e3b"],
  },
  {
    name: "Ocean",
    swatch: "#2563eb",
    scale: ["#eff6ff", "#dbeafe", "#bfdbfe", "#93c5fd", "#60a5fa", "#3b82f6", "#2563eb", "#1d4ed8", "#1e40af", "#1e3a8a"],
  },
  {
    name: "Violet",
    swatch: "#7c3aed",
    scale: ["#f5f3ff", "#ede9fe", "#ddd6fe", "#c4b5fd", "#a78bfa", "#8b5cf6", "#7c3aed", "#6d28d9", "#5b21b6", "#4c1d95"],
  },
  {
    name: "Rose",
    swatch: "#e11d48",
    scale: ["#fff1f2", "#ffe4e6", "#fecdd3", "#fda4af", "#fb7185", "#f43f5e", "#e11d48", "#be123c", "#9f1239", "#881337"],
  },
  {
    name: "Teal",
    swatch: "#0d9488",
    scale: ["#f0fdfa", "#ccfbf1", "#99f6e4", "#5eead4", "#2dd4bf", "#14b8a6", "#0d9488", "#0f766e", "#115e59", "#134e4b"],
  },
  {
    name: "Sunset",
    swatch: "#ea580c",
    scale: ["#fff7ed", "#ffedd5", "#fed7aa", "#fdba74", "#fb923c", "#f97316", "#ea580c", "#c2410c", "#9a3412", "#7c2d12"],
  },
];

const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];
const KEY = "polyclinic_theme";

export function applyTheme(name: string) {
  const theme = THEMES.find((t) => t.name === name) ?? THEMES[0];
  const root = document.documentElement;
  theme.scale.forEach((color, i) => {
    root.style.setProperty(`--color-brand-${STEPS[i]}`, color);
  });
  localStorage.setItem(KEY, theme.name);
}

export function getTheme(): string {
  return localStorage.getItem(KEY) ?? "Emerald";
}

export function initTheme() {
  applyTheme(getTheme());
}
