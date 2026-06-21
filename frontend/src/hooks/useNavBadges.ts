import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client";
import type { Role, AppNotification, Announcement, Slot } from "../api/types";

/**
 * Computes which sidebar tabs should show a red "new activity" dot.
 * Uses per-category "last seen" timestamps in localStorage; visiting a tab
 * clears its dot. First-ever load is treated as "seen" so nothing flags
 * retroactively.
 */
function seenKey(cat: string) {
  return `nav_seen_${cat}`;
}
function getSeen(cat: string): number {
  const v = localStorage.getItem(seenKey(cat));
  if (v === null) {
    const now = Date.now();
    localStorage.setItem(seenKey(cat), String(now));
    return now;
  }
  return Number(v);
}
function setSeen(cat: string) {
  localStorage.setItem(seenKey(cat), String(Date.now()));
}

function newest<T>(arr: T[], pick: (x: T) => string | undefined): number {
  return arr.reduce((m, x) => {
    const t = pick(x);
    return t ? Math.max(m, new Date(t).getTime()) : m;
  }, 0);
}

export function useNavBadges(role: Role) {
  const [badges, setBadges] = useState<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    const set = new Set<string>();

    // Appointments — based on stored (non-reminder) notifications.
    try {
      const { data } = await api.get<{ items: AppNotification[] }>("/notifications");
      const items = data.items.filter((n) => n.type !== "reminder");
      if (newest(items, (n) => n.createdAt) > getSeen("appointments")) {
        set.add(`/${role}/appointments`);
      }
    } catch {
      /* ignore */
    }

    // Notices — new announcements since last seen.
    try {
      const { data } = await api.get<Announcement[]>("/announcements");
      if (newest(data, (a) => a.createdAt) > getSeen("notices")) {
        set.add(`/${role}/notices`);
      }
    } catch {
      /* ignore */
    }

    // Doctor — nudge to add availability when there are no active slots.
    if (role === "doctor") {
      try {
        const { data } = await api.get<Slot[]>("/slots/mine");
        if (data.filter((s) => s.isActive).length === 0) set.add("/doctor/slots");
      } catch {
        /* ignore */
      }
    }

    setBadges(set);
  }, [role]);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 25000);
    return () => clearInterval(t);
  }, [refresh]);

  /** Clear a tab's dot when the user visits it. */
  const markSeen = useCallback(
    (path: string) => {
      if (path.endsWith("/appointments")) setSeen("appointments");
      else if (path.endsWith("/notices")) setSeen("notices");
      else return;
      setBadges((prev) => {
        const next = new Set(prev);
        next.delete(path);
        return next;
      });
    },
    []
  );

  return { badges, markSeen, refresh };
}
