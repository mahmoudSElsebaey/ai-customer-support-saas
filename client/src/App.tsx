import { Routes, Route, Navigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import TicketsList from "./pages/TicketsList";
import TicketDetail from "./pages/TicketDetail";
import CreateTicket from "./pages/CreateTicket";
import CustomersList from "./pages/CustomersList";
import CustomerDetail from "./pages/CustomerDetail";
import CreateCustomer from "./pages/CreateCustomer";
import KnowledgeList from "./pages/KnowledgeList";
import KnowledgeDetail from "./pages/KnowledgeDetail";
import KnowledgeForm from "./pages/KnowledgeForm";
import Analytics from "./pages/Analytics";
import Billing from "./pages/Billing";
import DashboardLayout from "./layouts/DashboardLayout";
import PortalLayout from "./layouts/PortalLayout";
import PortalLogin from "./pages/portal/PortalLogin";
import PortalRegister from "./pages/portal/PortalRegister";
import PortalTickets from "./pages/portal/PortalTickets";
import PortalTicketDetail from "./pages/portal/PortalTicketDetail";
import PortalNewTicket from "./pages/portal/PortalNewTicket";
import PortalKnowledge from "./pages/portal/PortalKnowledge";
import PortalArticle from "./pages/portal/PortalArticle";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { SkipLink } from "./components/SkipLink";
import { usePageTitle } from "./hooks/usePageTitle";

function Landing() {
  const { t, i18n } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <SkipLink />
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="h-8 w-8 rounded-lg bg-primary-600 flex items-center justify-center text-white font-bold text-sm"
              aria-hidden="true"
            >
              V
            </div>
            <span className="font-semibold text-lg tracking-tight">Voxly</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() =>
                i18n.changeLanguage(i18n.language === "ar" ? "en" : "ar")
              }
              className="text-sm text-slate-600 hover:text-primary-600 transition-colors"
              aria-label={
                i18n.language === "ar"
                  ? "Switch to English"
                  : "التبديل إلى العربية"
              }
            >
              {i18n.language === "ar" ? "English" : "العربية"}
            </button>
            <Link
              to="/login"
              className="text-sm font-medium text-slate-700 hover:text-primary-600"
            >
              {t("auth.login")}
            </Link>
            <Link
              to="/register"
              className="text-sm font-medium rounded-lg bg-primary-600 text-white px-3.5 py-1.5 hover:bg-primary-700 transition"
            >
              {t("auth.register")}
            </Link>
          </div>
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
        <section className="mx-auto max-w-6xl px-4 py-16 sm:py-24 text-center">
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-900 mb-4">
            {t("landing.heroTitle")}
          </h1>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto mb-10">
            {t("landing.heroBody")}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/register"
              className="rounded-lg bg-primary-600 text-white font-medium px-5 py-2.5 text-sm hover:bg-primary-700 transition"
            >
              {t("auth.register")}
            </Link>
            <Link
              to="/login"
              className="rounded-lg border border-slate-300 bg-white text-slate-700 font-medium px-5 py-2.5 text-sm hover:bg-slate-50 transition"
            >
              {t("auth.login")}
            </Link>
          </div>

          <ul className="mt-16 grid gap-4 sm:grid-cols-3 text-start max-w-3xl mx-auto">
            {[
              t("landing.featureTickets"),
              t("landing.featureKb"),
              t("landing.featureAnalytics"),
            ].map((label) => (
              <li
                key={label}
                className="rounded-xl border border-slate-200 bg-white p-5 text-sm font-medium text-slate-800 shadow-sm"
              >
                {label}
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="border-t border-slate-200 py-6 text-center text-sm text-slate-500 bg-white">
        © {new Date().getFullYear()} Voxly. All rights reserved.
      </footer>
    </div>
  );
}

function App() {
  const { i18n } = useTranslation();
  usePageTitle();

  useEffect(() => {
    document.documentElement.dir = i18n.language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/portal/:slug/login" element={<PortalLogin />} />
      <Route path="/portal/:slug/register" element={<PortalRegister />} />
      <Route path="/portal/:slug" element={<PortalLayout />}>
        <Route index element={<PortalTickets />} />
        <Route path="new" element={<PortalNewTicket />} />
        <Route path="tickets/:id" element={<PortalTicketDetail />} />
        <Route path="knowledge" element={<PortalKnowledge />} />
        <Route path="knowledge/:id" element={<PortalArticle />} />
      </Route>

      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tickets" element={<TicketsList />} />
        <Route path="/tickets/new" element={<CreateTicket />} />
        <Route path="/tickets/:id" element={<TicketDetail />} />
        <Route path="/customers" element={<CustomersList />} />
        <Route path="/customers/new" element={<CreateCustomer />} />
        <Route path="/customers/:id" element={<CustomerDetail />} />
        <Route path="/knowledge" element={<KnowledgeList />} />
        <Route path="/knowledge/new" element={<KnowledgeForm />} />
        <Route path="/knowledge/:id" element={<KnowledgeDetail />} />
        <Route path="/knowledge/:id/edit" element={<KnowledgeForm />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/billing" element={<Billing />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
