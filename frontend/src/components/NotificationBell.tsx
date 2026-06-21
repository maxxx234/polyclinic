import { useEffect, useRef, useState } from "react";
import {
  Bell,
  CalendarCheck,
  CalendarClock,
  CircleCheckBig,
  XCircle,
  CalendarPlus,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { api } from "../api/client";
import type { AppNotification, NotificationType } from "../api/types";
import { formatDateTime } from "../lib/format";

const ICONS: Record<NotificationType, { icon: LucideIcon; tone: string }> = {
  request: { icon: CalendarPlus, tone: "bg-amber-50 text-amber-600" },
  confirmed: { icon: CalendarCheck, tone: "bg-blue-50 text-blue-600" },
  completed: { icon: CircleCheckBig, tone: "bg-emerald-50 text-emerald-600" },
  cancelled: { icon: XCircle, tone: "bg-rose-50 text-rose-600" },
  reminder: { icon: CalendarClock, tone: "bg-violet-50 text-violet-600" },
};

export function NotificationBell() {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  async function load() {
    try {
      const res = await api.get<{ items: AppNotification[]; unreadCount: number }>(
        "/notifications"
      );
      setItems(res.data.items);
      setUnread(res.data.unreadCount);
    } catch {
      /* ignore */
    }
  }

  // Initial load + poll every 25s for new notifications.
  useEffect(() => {
    load();
    const t = setInterval(load, 25000);
    return () => clearInterval(t);
  }, []);

  // Close on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function toggle() {
    const next = !open;
    setOpen(next);
    // Mark all read when opening (clears the red dot).
    if (next && unread > 0) {
      try {
        await api.patch("/notifications/read-all");
        setUnread(0);
      } catch {
        /* ignore */
      }
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggle}
        className="relative grid h-9 w-9 place-items-center rounded-lg text-slate-600 transition hover:bg-slate-100"
        aria-label="Notifications"
      >
        <Bell size={19} />
        {unread > 0 && (
          <>
            <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
            <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 animate-ping rounded-full bg-red-500" />
          </>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
          style={{ animation: "var(--animate-scale-in)" }}
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="font-bold text-slate-800">Notifications</p>
            <Bell size={16} className="text-slate-400" />
          </div>

          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-slate-400">
                You're all caught up 🎉
              </div>
            ) : (
              items.map((n) => {
                const cfg = ICONS[n.type] ?? ICONS.reminder;
                return (
                  <div
                    key={n._id}
                    className={`flex gap-3 border-b border-slate-50 px-4 py-3 last:border-0 ${
                      !n.read ? "bg-brand-50/40" : ""
                    }`}
                  >
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${cfg.tone}`}>
                      <cfg.icon size={17} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800">{n.title}</p>
                      <p className="text-xs text-slate-500">{n.message}</p>
                      {!n.reminder && (
                        <p className="mt-0.5 text-[11px] text-slate-400">
                          {formatDateTime(n.createdAt)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
