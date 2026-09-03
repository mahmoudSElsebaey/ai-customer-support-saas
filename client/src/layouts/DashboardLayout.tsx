import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useMeQuery, useLogoutMutation } from "@/features/auth/authApi";
import { useSocket } from "@/hooks/useSocket";
import { SkipLink } from "@/components/SkipLink";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/dashboard", labelKey: "nav.dashboard" },
  { path: "/tickets", labelKey: "nav.tickets" },
  { path: "/customers", labelKey: "nav.customers" },
  { path: "/knowledge", labelKey: "nav.knowledge" },
  { path: "/analytics", labelKey: "nav.analytics" },
  { path: "/billing", labelKey: "nav.billing" },
];

export default function DashboardLayout() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { data } = useMeQuery();
  const [logout] = useLogoutMutation();
  const { connected, onlineUserIds } = useSocket();
  const [mobileOpen, setMobileOpen] = useState(false);

  const user = data?.data;

  const handleLogout = async () => {
    try {
      await logout().unwrap();
    } finally {
      navigate("/login");
    }
  };

  const isActive = (path: string) =>
    path === "/dashboard"
      ? location.pathname === "/dashboard"
      : location.pathname.startsWith(path);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <SkipLink />
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="mx-auto max-w-7xl px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-6">
            <button
              type="button"
              className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100"
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav"
              aria-label={t("a11y.toggleMenu", { defaultValue: "Toggle menu" })}
              onClick={() => setMobileOpen((v) => !v)}
            >
              <span className="sr-only">
                {t("a11y.toggleMenu", { defaultValue: "Toggle menu" })}
              </span>
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                {mobileOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>

            <Link
              to="/dashboard"
              className="flex items-center gap-2 shrink-0"
              aria-label="Voxly home"
            >
              <div
                className="h-7 w-7 rounded-lg bg-primary-600 flex items-center justify-center text-white font-bold text-xs"
                aria-hidden="true"
              >
                V
              </div>
              <span className="font-semibold tracking-tight">Voxly</span>
            </Link>

            <nav
              className="hidden lg:flex items-center gap-1"
              aria-label={t("a11y.mainNav", { defaultValue: "Main" })}
            >
              {navItems.map((item) => {
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "px-2.5 py-1.5 rounded-md text-sm font-medium transition",
                      active
                        ? "bg-primary-50 text-primary-700"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    )}
                  >
                    {t(item.labelKey)}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={cn(
                "hidden sm:inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full border",
                connected
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-slate-50 text-slate-500 border-slate-200"
              )}
              role="status"
              aria-live="polite"
              title={`${onlineUserIds.length} online`}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  connected ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                )}
                aria-hidden="true"
              />
              {connected ? `${onlineUserIds.length} online` : "Offline"}
            </span>

            <button
              type="button"
              onClick={() =>
                i18n.changeLanguage(i18n.language === "ar" ? "en" : "ar")
              }
              className="text-xs text-slate-500 hover:text-primary-600 rounded px-1.5 py-1"
              aria-label={
                i18n.language === "ar"
                  ? "Switch to English"
                  : "التبديل إلى العربية"
              }
            >
              {i18n.language === "ar" ? "EN" : "ع"}
            </button>
            {user && (
              <span className="text-sm text-slate-600 hidden sm:inline">
                {user.name}
              </span>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="text-sm text-slate-500 hover:text-red-600"
            >
              {t("auth.logout")}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <nav
            id="mobile-nav"
            className="lg:hidden border-t border-slate-100 bg-white px-4 py-3 space-y-1"
            aria-label={t("a11y.mainNav", { defaultValue: "Main" })}
          >
            {navItems.map((item) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "block px-3 py-2 rounded-md text-sm font-medium",
                    active
                      ? "bg-primary-50 text-primary-700"
                      : "text-slate-700 hover:bg-slate-50"
                  )}
                >
                  {t(item.labelKey)}
                </Link>
              );
            })}
          </nav>
        )}
      </header>

      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 outline-none"
      >
        <Outlet />
      </main>
    </div>
  );
}
