import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useMeQuery, useLogoutMutation } from "@/features/auth/authApi";
import { useSocket } from "@/hooks/useSocket";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/dashboard", labelKey: "nav.dashboard" },
  { path: "/tickets", labelKey: "nav.tickets" },
  { path: "/customers", labelKey: "nav.customers" },
  { path: "/knowledge", labelKey: "nav.knowledge" },
];

export default function DashboardLayout() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { data } = useMeQuery();
  const [logout] = useLogoutMutation();
  const { connected, onlineUserIds } = useSocket();

  const user = data?.data;

  const handleLogout = async () => {
    try {
      await logout().unwrap();
    } finally {
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="mx-auto max-w-7xl px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-primary-600 flex items-center justify-center text-white font-bold text-xs">
                V
              </div>
              <span className="font-semibold tracking-tight">Voxly</span>
            </Link>

            <nav className="hidden sm:flex items-center gap-1">
              {navItems.map((item) => {
                const active =
                  item.path === "/dashboard"
                    ? location.pathname === "/dashboard"
                    : location.pathname.startsWith(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-sm font-medium transition",
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
              title={`${onlineUserIds.length} online`}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  connected ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                )}
              />
              {connected ? `${onlineUserIds.length} online` : "Offline"}
            </span>

            <button
              onClick={() =>
                i18n.changeLanguage(i18n.language === "ar" ? "en" : "ar")
              }
              className="text-xs text-slate-500 hover:text-primary-600"
            >
              {i18n.language === "ar" ? "EN" : "ع"}
            </button>
            {user && (
              <span className="text-sm text-slate-600 hidden sm:inline">
                {user.name}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="text-sm text-slate-500 hover:text-red-600"
            >
              {t("auth.logout")}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
