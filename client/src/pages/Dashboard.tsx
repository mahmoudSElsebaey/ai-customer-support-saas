import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useMeQuery } from "@/features/auth/authApi";
import { useGetTicketsQuery } from "@/features/tickets/ticketsApi";
import { useGetCustomersQuery } from "@/features/customers/customersApi";

export default function Dashboard() {
  const { t } = useTranslation();
  const { data: meData } = useMeQuery();
  const { data: ticketsData } = useGetTicketsQuery({ limit: 5 });
  const { data: customersData } = useGetCustomersQuery({ limit: 1 });

  const user = meData?.data;
  const tickets = ticketsData?.data;
  const customersTotal = customersData?.data?.pagination?.total ?? 0;

  const openCount =
    tickets?.items.filter((t) => t.status === "OPEN" || t.status === "IN_PROGRESS")
      .length ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {t("dashboard.welcome")}, {user?.name}
        </h1>
        <p className="text-slate-500 text-sm mt-1">{t("dashboard.subtitle")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            {t("tickets.title")}
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {tickets?.pagination?.total ?? "—"}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Open / Active
          </p>
          <p className="mt-2 text-2xl font-bold text-primary-600">{openCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            {t("customers.title")}
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{customersTotal}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            {t("dashboard.organization")}
          </p>
          <p className="mt-2 text-lg font-semibold text-slate-900 truncate">
            {user?.organization?.name}
          </p>
          <p className="text-xs text-slate-400">{user?.organization?.plan}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          to="/tickets/new"
          className="rounded-lg bg-primary-600 text-white text-sm font-medium px-4 py-2 hover:bg-primary-700 transition"
        >
          {t("tickets.createTicket")}
        </Link>
        <Link
          to="/customers/new"
          className="rounded-lg border border-slate-300 text-slate-700 text-sm font-medium px-4 py-2 hover:bg-slate-50 transition"
        >
          {t("customers.create")}
        </Link>
        <Link
          to="/tickets"
          className="rounded-lg border border-slate-300 text-slate-700 text-sm font-medium px-4 py-2 hover:bg-slate-50 transition"
        >
          {t("tickets.title")}
        </Link>
      </div>

      <div className="rounded-xl border border-dashed border-slate-200 bg-white/50 p-6 text-center text-sm text-slate-500">
        Phase 3 complete — Core Support System (Customers, Tickets, Messages).
        <br />
        Next: Phase 4 — Real-time (Socket.IO).
      </div>
    </div>
  );
}
