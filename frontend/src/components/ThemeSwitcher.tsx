import { useEffect, useRef, useState } from "react";
import { Palette, Check } from "lucide-react";
import { THEMES, applyTheme, getTheme } from "../lib/themes";

export function ThemeSwitcher() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(getTheme());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function pick(name: string) {
    applyTheme(name);
    setActive(name);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="grid h-9 w-9 place-items-center rounded-lg text-slate-600 transition hover:bg-slate-100"
        aria-label="Change theme"
        title="Change theme color"
      >
        <Palette size={19} />
      </button>

      {open && (
        <div
          className="absolute right-0 z-50 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl"
          style={{ animation: "var(--animate-scale-in)" }}
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Theme color
          </p>
          <div className="grid grid-cols-3 gap-3">
            {THEMES.map((t) => (
              <button
                key={t.name}
                onClick={() => pick(t.name)}
                className="flex flex-col items-center gap-1.5"
                title={t.name}
              >
                <span
                  className="grid h-10 w-10 place-items-center rounded-full ring-2 ring-offset-2 transition"
                  style={{
                    backgroundColor: t.swatch,
                    // @ts-expect-error css var
                    "--tw-ring-color": active === t.name ? t.swatch : "transparent",
                  }}
                >
                  {active === t.name && <Check size={16} className="text-white" />}
                </span>
                <span className="text-[11px] font-medium text-slate-500">{t.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
