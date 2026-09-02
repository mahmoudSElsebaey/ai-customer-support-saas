import { Routes, Route, Navigate } from "react-router-dom";
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
import DashboardLayout from "./layouts/DashboardLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";

function Landing() {
  const { t, i18n } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary-600 flex items-center justify-center text-white font-bold text-sm">
              V
            </div>
            <span className="font-semibold text-lg tracking-tight">Voxly</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() =>
                i18n.changeLanguage(i18n.language === "ar" ? "en" : "ar")
              }
              className="text-sm text-slate-600 hover:text-primary-600 transition-colors"
            >
              {i18n.language === "ar" ? "English" : "العربية"}
            </button>
            <a
              href="/login"
              className="text-sm font-medium text-slate-700 hover:text-primary-600"
            >
              {t("auth.login")}
            </a>
            <a
              href="/register"
              className="text-sm font-medium rounded-lg bg-primary-600 text-white px-3.5 py-1.5 hover:bg-primary-700 transition"
            >
              {t("auth.register")}
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-xl">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 mb-3">
            {t("common.welcome")}
          </h1>
          <p className="text-slate-600 text-lg mb-8">{t("common.tagline")}</p>
          <div className="flex items-center justify-center gap-3">
            <a
              href="/register"
              className="rounded-lg bg-primary-600 text-white font-medium px-5 py-2.5 text-sm hover:bg-primary-700 transition"
            >
              {t("auth.register")}
            </a>
            <a
              href="/login"
              className="rounded-lg border border-slate-300 text-slate-700 font-medium px-5 py-2.5 text-sm hover:bg-slate-50 transition"
            >
              {t("auth.login")}
            </a>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 py-6 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} Voxly. All rights reserved.
      </footer>
    </div>
  );
}

function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    document.documentElement.dir = i18n.language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

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
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
