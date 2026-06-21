import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  CalendarPlus,
  CalendarDays,
  Home,
  Receipt,
  Star,
  Sparkles,
  Megaphone,
  Stethoscope,
  Clock,
  LayoutDashboard,
  Users,
  ClipboardList,
  LogOut,
  Menu,
  HeartPulse,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { NotificationBell } from "./NotificationBell";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { ChatBot } from "./ChatBot";
import { useNavBadges } from "../hooks/useNavBadges";
import type { Role } from "../api/types";

interface Tab {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

const TABS: Record<Role, Tab[]> = {
  patient: [
    { to: "/patient/home", label: "Home", icon: Home },
    { to: "/patient/book", label: "Book Appointment", icon: CalendarPlus },
    { to: "/patient/symptom-checker", label: "Symptom Checker", icon: Sparkles },
    { to: "/patient/appointments", label: "My Appointments", icon: CalendarDays },
    { to: "/patient/bills", label: "Bills", icon: Receipt },
    { to: "/patient/reviews", label: "Patient Corner", icon: Star },
    { to: "/patient/notices", label: "Notices", icon: Megaphone },
  ],
  doctor: [
    { to: "/doctor/appointments", label: "Appointments", icon: Stethoscope },
    { to: "/doctor/slots", label: "My Slots", icon: Clock },
    { to: "/doctor/notices", label: "Notices", icon: Megaphone },
  ],
  admin: [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/admin/doctors", label: "Doctors", icon: Stethoscope },
    { to: "/admin/patients", label: "Patients", icon: Users },
    { to: "/admin/appointments", label: "Appointments", icon: ClipboardList },
    { to: "/admin/notices", label: "Notices", icon: Megaphone },
  ],
};

const ROLE_LABEL: Record<Role, string> = {
  patient: "Patient Portal",
  doctor: "Doctor Portal",
  admin: "Admin Console",
};

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { badges, markSeen } = useNavBadges((user?.role ?? "patient") as Role);

  // Clear a tab's red dot when the user navigates to it.
  useEffect(() => {
    markSeen(location.pathname);
  }, [location.pathname, markSeen]);

  if (!user) return null;
  const tabs = TABS[user.role];

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const initials = user.name
    .replace(/^Dr\.?\s*/, "")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const SidebarInner = (
    <>
      <Link to="/" className="flex items-center gap-2.5 px-5 py-5">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-600/30">
          <HeartPulse size={22} />
        </span>
        <div>
          <p className="text-base font-bold leading-tight text-slate-800">Polyclinic</p>
          <p className="text-[11px] font-medium text-brand-600">{ROLE_LABEL[user.role]}</p>
        </div>
      </Link>

      <nav className="flex-1 space-y-1 px-3">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            onClick={() => {
              setMobileOpen(false);
              markSeen(t.to);
            }}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? "bg-brand-50 text-brand-700 shadow-sm"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <t.icon
                  size={19}
                  className={isActive ? "text-brand-600" : "text-slate-400 group-hover:text-slate-600"}
                />
                {t.label}
                {badges.has(t.to) && (
                  <span className="relative ml-auto flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-100 p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-sm font-bold text-white">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-700">{user.name}</p>
            <p className="truncate text-xs text-slate-400">{user.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="mt-2 flex w-full items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
        >
          <LogOut size={18} /> Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
        {SidebarInner}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            style={{ animation: "var(--animate-fade-in)" }}
            onClick={() => setMobileOpen(false)}
          />
          <aside
            className="absolute inset-y-0 left-0 flex w-64 flex-col bg-white shadow-2xl"
            style={{ animation: "var(--animate-slide-up)" }}
          >
            {SidebarInner}
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="lg:pl-64">
        {/* Top bar (mobile shows menu button) */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur lg:px-8">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <div className="hidden lg:block">
            <p className="text-sm text-slate-400">
              Welcome back, <span className="font-semibold text-slate-700">{user.name}</span>
            </p>
          </div>
          <div className="flex items-center gap-2 lg:hidden">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white">
              <HeartPulse size={18} />
            </span>
            <span className="font-bold text-slate-800">Polyclinic</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ThemeSwitcher />
            <NotificationBell />
            <span className="badge bg-brand-50 text-brand-700 ring-1 ring-brand-100 capitalize">
              {user.role}
            </span>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6 lg:px-8" key={user.role}>
          <div style={{ animation: "var(--animate-fade-in)" }}>
            <Outlet />
          </div>
        </main>
      </div>

      <ChatBot />
    </div>
  );
}
