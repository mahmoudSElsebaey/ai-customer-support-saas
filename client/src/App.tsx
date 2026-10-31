import { Routes, Route, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import Login from "./pages/Login";
import LandingPage from "./pages/LandingPage";
import "./styles/landing.css";
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
import { usePageTitle } from "./hooks/usePageTitle";

function App() {
  const { i18n } = useTranslation();
  usePageTitle();

  useEffect(() => {
    document.documentElement.dir = i18n.language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
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
