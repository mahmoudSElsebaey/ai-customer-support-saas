import { Link, Outlet, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { usePortalLogoutMutation } from "@/features/portal/portalApi";
import { SkipLink } from "@/components/SkipLink";

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
      <SkipLink />
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="mx-auto max-w-3xl px-4 h-14 flex items-center justify-between gap-3">
          <Link
            to={base}
            className="font-semibold text-slate-900 shrink-0"
            aria-label={t("portal.helpCenter")}
          >
            {t("portal.helpCenter")}
          </Link>
          <nav
            className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1 text-sm"
            aria-label={t("a11y.mainNav", { defaultValue: "Main" })}
          >
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
      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 mx-auto w-full max-w-3xl px-4 py-6 outline-none"
      >
        <Outlet />
      </main>
    </div>
  );
}
