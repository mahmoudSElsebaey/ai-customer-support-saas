import { Link, Outlet, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { usePortalLogoutMutation } from "@/features/portal/portalApi";

export default function PortalLayout() {
  const { t } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [logout] = usePortalLogoutMutation();

  const base = `/portal/${slug}`;

  const handleLogout = async () => {
    try {
      await logout().unwrap();
    } finally {
      navigate(`${base}/login`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-3xl px-4 h-14 flex items-center justify-between">
          <Link to={base} className="font-semibold text-slate-900">
            {t("portal.helpCenter")}
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link to={base} className="text-slate-600 hover:text-primary-600">
              {t("portal.myTickets")}
            </Link>
            <Link
              to={`${base}/knowledge`}
              className="text-slate-600 hover:text-primary-600"
            >
              {t("portal.help")}
            </Link>
            <Link
              to={`${base}/new`}
              className="text-primary-600 font-medium hover:underline"
            >
              {t("portal.newTicket")}
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="text-slate-500 hover:text-red-600"
            >
              {t("auth.logout")}
            </button>
          </nav>
        </div>
      </header>
      <main className="flex-1 mx-auto w-full max-w-3xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
