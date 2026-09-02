import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useMeQuery } from "@/features/auth/authApi";
import {
  useGetTicketsQuery,
  useGetWorkspaceStatsQuery,
} from "@/features/tickets/ticketsApi";
import { useGetCustomersQuery } from "@/features/customers/customersApi";
import { StatusBadge } from "@/components/StatusBadge";

export default function Dashboard() {
  const { t } = useTranslation();
  const { data: meData } = useMeQuery();
  const { data: statsData } = useGetWorkspaceStatsQuery(undefined, {
    pollingInterval: 20000,
  });
  const { data: ticketsData } = useGetTicketsQuery({ limit: 8 });
  const { data: customersData } = useGetCustomersQuery({ limit: 1 });

  const user = meData?.data;
  const stats = statsData?.data;
  const recent = ticketsData?.data?.items ?? [];
  const customersTotal = customersData?.data?.pagination?.total ?? 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {t("dashboard.welcome")}, {user?.name}
          </h1>
          <p className="text-slate-500 text-sm mt-1">{t("dashboard.subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/tickets?view=unassigned"
            className="rounded-lg bg-primary-600 text-white text-sm font-medium px-4 py-2 hover:bg-primary-700 transition"
          >
            {t("workspace.openQueue")}
          </Link>
          <Link
            to="/tickets/new"
            className="rounded-lg border border-slate-300 text-slate-700 text-sm font-medium px-4 py-2 hover:bg-slate-50 transition"
          >
            {t("tickets.createTicket")}
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t("workspace.active")} value={stats?.active} accent />
        <StatCard label={t("workspace.mine")} value={stats?.mine} />
        <StatCard label={t("workspace.unassigned")} value={stats?.unassigned} />
        <StatCard label={t("workspace.urgent")} value={stats?.urgent} danger />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label={t("workspace.open")} value={stats?.open} compact />
        <StatCard
          label={t("workspace.resolvedToday")}
          value={stats?.resolvedToday}
          compact
        />
        <StatCard
          label={t("customers.title")}
          value={customersTotal}
          compact
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-800">
            {t("workspace.recentTickets")}
          </h2>
          <Link to="/tickets" className="text-xs text-primary-600 hover:underline">
            {t("workspace.viewAll")}
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-400">
            {t("tickets.empty")}
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {recent.map((ticket) => (
              <li key={ticket.id}>
                <Link
                  to={`/tickets/${ticket.id}`}
                  className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-slate-50 transition"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {ticket.subject}
                    </p>
                    <p className="text-xs text-slate-500">
                      {ticket.customer.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge value={ticket.priority} />
                    <StatusBadge value={ticket.status} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-xs text-slate-400">
        {user?.organization?.name} · {user?.role} · {user?.organization?.plan}
      </p>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
  danger,
  compact,
}: {
  label: string;
  value?: number;
  accent?: boolean;
  danger?: boolean;
  compact?: boolean;
}) {
  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 ${compact ? "p-4" : "p-5"}`}
    >
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
        {label}
      </p>
      <p
        className={`mt-2 font-bold ${compact ? "text-xl" : "text-2xl"} ${
          danger
            ? "text-red-600"
            : accent
              ? "text-primary-600"
              : "text-slate-900"
        }`}
      >
        {value ?? "—"}
      </p>
    </div>
  );
}
